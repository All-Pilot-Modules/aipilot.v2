"""
Module Export Service
Exports comprehensive module data to Excel format
"""
import pandas as pd
from io import BytesIO
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Any, List
from datetime import datetime

from app.models.module import Module
from app.models.question import Question
from app.models.student_answer import StudentAnswer
from app.models.ai_feedback import AIFeedback
from app.models.student_enrollment import StudentEnrollment
from app.models.survey_response import SurveyResponse
from app.models.user import User


def _format_student_answer(answer: Any) -> str:
    """Render a StudentAnswer.answer JSONB payload as human-readable text.

    Payload shape depends on question type (set by the student test page):
    mcq -> selected_option_id, mcq_multiple -> selected_options,
    fill_blank -> blanks, multi_part -> sub_answers, short/long -> text_response.
    """
    if not isinstance(answer, dict) or not answer:
        return str(answer) if answer else ''

    if 'blanks' in answer:
        value = answer['blanks']
    elif 'selected_options' in answer:
        value = answer['selected_options']
    elif 'sub_answers' in answer:
        value = answer['sub_answers']
    else:
        value = (
            answer.get('text_response')
            or answer.get('selected_option_id')
            or answer.get('selected_option')
        )

    if value is None:
        return ''
    if isinstance(value, dict):
        return ', '.join(f'{k}: {v}' for k, v in value.items())
    if isinstance(value, list):
        return ', '.join(str(v) for v in value)
    return str(value)


class ModuleExportService:
    """Service for exporting module data to Excel with multiple sheets"""

    def export_module_to_excel(self, db: Session, module_id: UUID) -> BytesIO:
        """
        Export all module data to Excel with multiple sheets

        Args:
            db: Database session
            module_id: UUID of the module to export

        Returns:
            BytesIO object containing the Excel file
        """
        # Fetch all data
        module = db.query(Module).filter(Module.id == module_id).first()
        if not module:
            raise ValueError(f"Module with ID {module_id} not found")

        questions = self._fetch_questions(db, module_id)
        enrollments = self._fetch_enrollments(db, module_id)
        answers_attempt1, answers_attempt2 = self._fetch_answers(db, module_id)
        feedback = self._fetch_feedback(db, module_id)
        surveys = self._fetch_surveys(db, module_id)
        performance = self._calculate_performance(db, module_id)

        # Create Excel file in memory
        output = BytesIO()

        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            # Sheet 1: Module Overview
            self._write_module_overview(writer, module, questions, enrollments, answers_attempt1, answers_attempt2)

            # Sheet 2: Questions
            if questions:
                self._write_questions(writer, questions)

            # Sheet 3: Student Enrollments
            if enrollments:
                self._write_enrollments(writer, enrollments)

            # Sheet 4 & 5: Student Answers (Attempt 1 & 2)
            if answers_attempt1:
                self._write_answers(writer, answers_attempt1, "Answers - Attempt 1")
            if answers_attempt2:
                self._write_answers(writer, answers_attempt2, "Answers - Attempt 2")

            # Sheet 6: AI Feedback
            if feedback:
                self._write_feedback(writer, feedback)

            # Sheet 7: Performance Summary
            if performance:
                self._write_performance(writer, performance)

            # Sheet 8: Survey Responses
            if surveys:
                self._write_surveys(writer, surveys)

        output.seek(0)
        return output

    def _fetch_questions(self, db: Session, module_id: UUID) -> List[Dict[str, Any]]:
        """Fetch all questions for the module"""
        questions = db.query(Question).filter(Question.module_id == module_id).all()

        result = []
        for q in questions:
            data = {
                'Question ID': str(q.id),
                'Type': q.type,
                'Question Text': q.text,
                'Status': q.status,
                'AI Generated': 'Yes' if q.is_ai_generated else 'No',
                'Learning Outcome': q.learning_outcome or '',
                'Bloom Taxonomy': q.bloom_taxonomy or '',
                'Slide Number': q.slide_number or '',
            }

            # Add MCQ specific fields
            if q.type == 'mcq' and q.options:
                data['Correct Answer'] = q.correct_option_id or ''
                for key, value in q.options.items():
                    data[f'Option {key}'] = value
            else:
                data['Correct Answer'] = q.correct_answer or ''

            result.append(data)

        return result

    def _fetch_enrollments(self, db: Session, module_id: UUID) -> List[Dict[str, Any]]:
        """Fetch all student enrollments"""
        enrollments = db.query(StudentEnrollment).filter(
            StudentEnrollment.module_id == module_id
        ).all()

        result = []
        for e in enrollments:
            result.append({
                'Student ID': e.student_id,
                'Enrolled At': e.enrolled_at.strftime('%Y-%m-%d %H:%M:%S') if e.enrolled_at else '',
                'Consent Status': self._get_consent_status(e.waiver_status),
                'Consent Submitted At': e.consent_submitted_at.strftime('%Y-%m-%d %H:%M:%S') if e.consent_submitted_at else ''
            })

        return result

    def _fetch_answers(self, db: Session, module_id: UUID) -> tuple:
        """Fetch all student answers, separated by attempt"""
        answers = db.query(StudentAnswer, Question.text, Question.type).join(
            Question, StudentAnswer.question_id == Question.id
        ).filter(StudentAnswer.module_id == module_id).all()

        attempt1 = []
        attempt2 = []

        for answer, question_text, question_type in answers:
            student_answer = _format_student_answer(answer.answer)

            data = {
                'Answer ID': str(answer.id),
                'Student ID': answer.student_id,
                'Question ID': str(answer.question_id),
                'Question Text': question_text,
                'Question Type': question_type,
                'Student Answer': student_answer,
                'Submitted At': answer.submitted_at.strftime('%Y-%m-%d %H:%M:%S') if answer.submitted_at else ''
            }

            if answer.attempt == 1:
                attempt1.append(data)
            else:
                attempt2.append(data)

        return attempt1, attempt2

    def _fetch_feedback(self, db: Session, module_id: UUID) -> List[Dict[str, Any]]:
        """Fetch all AI feedback"""
        feedback = db.query(AIFeedback, StudentAnswer.student_id).join(
            StudentAnswer, AIFeedback.answer_id == StudentAnswer.id
        ).filter(StudentAnswer.module_id == module_id).all()

        result = []
        for fb, student_id in feedback:
            # Extract feedback text from feedback_data JSONB
            feedback_text = ''
            strengths = ''
            improvements = ''

            if fb.feedback_data:
                feedback_text = fb.feedback_data.get('explanation', '') or fb.feedback_data.get('feedback', '')
                strengths = fb.feedback_data.get('strengths', '')
                improvements = fb.feedback_data.get('areas_for_improvement', '') or fb.feedback_data.get('improvements', '')

            result.append({
                'Feedback ID': str(fb.id),
                'Answer ID': str(fb.answer_id),
                'Student ID': student_id,
                'Is Correct': 'Yes' if fb.is_correct else 'No',
                'Score': fb.score if fb.score is not None else '',
                'Feedback': feedback_text,
                'Strengths': strengths,
                'Improvements': improvements,
                'Generated At': fb.generated_at.strftime('%Y-%m-%d %H:%M:%S') if fb.generated_at else ''
            })

        return result

    def _fetch_surveys(self, db: Session, module_id: UUID) -> List[Dict[str, Any]]:
        """Fetch all survey responses"""
        surveys = db.query(SurveyResponse).filter(
            SurveyResponse.module_id == module_id
        ).all()

        result = []
        for survey in surveys:
            data = {
                'Student ID': survey.student_id,
                'Submitted At': survey.submitted_at.strftime('%Y-%m-%d %H:%M:%S') if survey.submitted_at else ''
            }

            # Add each survey response as a column
            if survey.responses:
                for key, value in survey.responses.items():
                    data[f'Q: {key}'] = value

            result.append(data)

        return result

    def _calculate_performance(self, db: Session, module_id: UUID) -> List[Dict[str, Any]]:
        """Calculate student performance summary"""
        # Get all questions count
        total_questions = db.query(Question).filter(Question.module_id == module_id).count()

        # Get all answers with feedback
        answers = db.query(
            StudentAnswer.student_id,
            StudentAnswer.attempt,
            AIFeedback.is_correct,
            AIFeedback.score
        ).outerjoin(
            AIFeedback, StudentAnswer.id == AIFeedback.answer_id
        ).filter(
            StudentAnswer.module_id == module_id
        ).all()

        # Aggregate by student
        student_stats = {}
        for student_id, attempt, is_correct, score in answers:
            if student_id not in student_stats:
                student_stats[student_id] = {
                    'attempt1_answered': 0,
                    'attempt1_correct': 0,
                    'attempt1_scores': [],
                    'attempt2_answered': 0,
                    'attempt2_correct': 0,
                    'attempt2_scores': []
                }

            if attempt == 1:
                student_stats[student_id]['attempt1_answered'] += 1
                if is_correct:
                    student_stats[student_id]['attempt1_correct'] += 1
                if score is not None:
                    student_stats[student_id]['attempt1_scores'].append(score)
            else:
                student_stats[student_id]['attempt2_answered'] += 1
                if is_correct:
                    student_stats[student_id]['attempt2_correct'] += 1
                if score is not None:
                    student_stats[student_id]['attempt2_scores'].append(score)

        result = []
        for student_id, stats in student_stats.items():
            avg_score_a1 = sum(stats['attempt1_scores']) / len(stats['attempt1_scores']) if stats['attempt1_scores'] else 0
            avg_score_a2 = sum(stats['attempt2_scores']) / len(stats['attempt2_scores']) if stats['attempt2_scores'] else 0

            result.append({
                'Student ID': student_id,
                'Total Questions': total_questions,
                'Answered (Attempt 1)': stats['attempt1_answered'],
                'Correct (Attempt 1)': stats['attempt1_correct'],
                'Avg Score (Attempt 1)': round(avg_score_a1, 2),
                'Answered (Attempt 2)': stats['attempt2_answered'],
                'Correct (Attempt 2)': stats['attempt2_correct'],
                'Avg Score (Attempt 2)': round(avg_score_a2, 2),
                'Improvement': round(avg_score_a2 - avg_score_a1, 2) if avg_score_a1 and avg_score_a2 else 0,
                'Completion %': round((stats['attempt1_answered'] / total_questions * 100) if total_questions > 0 else 0, 2)
            })

        return result

    def _write_module_overview(self, writer, module, questions, enrollments, answers_a1, answers_a2):
        """Write module overview sheet"""
        overview_data = {
            'Field': [
                'Module Name',
                'Description',
                'Access Code',
                'Created At',
                'Due Date',
                'Consent Required',
                'Chatbot Enabled',
                '',
                'Total Questions',
                'Total Students Enrolled',
                'Total Answers (Attempt 1)',
                'Total Answers (Attempt 2)',
                'Export Date'
            ],
            'Value': [
                module.name,
                module.description or '',
                module.access_code or '',
                module.created_at.strftime('%Y-%m-%d %H:%M:%S') if module.created_at else '',
                module.due_date.strftime('%Y-%m-%d') if module.due_date else '',
                'Yes' if module.consent_required else 'No',
                'Yes' if module.chatbot_instructions else 'No',
                '',
                len(questions),
                len(enrollments),
                len(answers_a1),
                len(answers_a2),
                datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            ]
        }

        df = pd.DataFrame(overview_data)
        df.to_excel(writer, sheet_name='Module Overview', index=False)
        self._autofit_columns(writer, df, 'Module Overview')

    def _write_questions(self, writer, questions):
        """Write questions sheet"""
        df = pd.DataFrame(questions)
        df.to_excel(writer, sheet_name='Questions', index=False)
        self._autofit_columns(writer, df, 'Questions')

    def _write_enrollments(self, writer, enrollments):
        """Write enrollments sheet"""
        df = pd.DataFrame(enrollments)
        df.to_excel(writer, sheet_name='Student Enrollments', index=False)
        self._autofit_columns(writer, df, 'Student Enrollments')

    def _write_answers(self, writer, answers, sheet_name):
        """Write answers sheet"""
        df = pd.DataFrame(answers)
        df.to_excel(writer, sheet_name=sheet_name, index=False)
        self._autofit_columns(writer, df, sheet_name)

    def _write_feedback(self, writer, feedback):
        """Write feedback sheet"""
        df = pd.DataFrame(feedback)
        df.to_excel(writer, sheet_name='AI Feedback', index=False)
        self._autofit_columns(writer, df, 'AI Feedback')

    def _write_performance(self, writer, performance):
        """Write performance summary sheet"""
        df = pd.DataFrame(performance)
        df.to_excel(writer, sheet_name='Performance Summary', index=False)
        self._autofit_columns(writer, df, 'Performance Summary')

    def _write_surveys(self, writer, surveys):
        """Write surveys sheet"""
        df = pd.DataFrame(surveys)
        df.to_excel(writer, sheet_name='Survey Responses', index=False)
        self._autofit_columns(writer, df, 'Survey Responses')

    def _autofit_columns(self, writer, df, sheet_name):
        """Auto-fit column widths based on content"""
        worksheet = writer.sheets[sheet_name]

        for idx, col in enumerate(df.columns):
            # Get the maximum length of the column content
            max_length = max(
                df[col].astype(str).str.len().max(),  # Max length in column data
                len(str(col))  # Length of column name
            )

            # Add a little extra space and cap at reasonable width
            adjusted_width = min(max_length + 2, 100)

            # Set column width
            worksheet.set_column(idx, idx, adjusted_width)

    def _get_consent_status(self, waiver_status):
        """Convert waiver status code to readable text"""
        status_map = {
            1: 'Agreed',
            2: 'Declined',
            3: 'Not Eligible',
            None: 'Not Submitted'
        }
        return status_map.get(waiver_status, 'Unknown')

    def export_feedback_specific(self, db: Session, module_id: UUID) -> BytesIO:
        """
        Export feedback-specific format showing all attempts and feedback for each student/question

        Format: One row per student per question with columns for each attempt
        Columns: Student ID | Question | Correct Answer | Attempt 1 Answer | Attempt 1 Feedback |
                 Attempt 2 Answer | Attempt 2 Feedback | ... (up to 5 attempts)

        Args:
            db: Database session
            module_id: UUID of the module to export

        Returns:
            BytesIO object containing the Excel file
        """
        # Fetch module
        module = db.query(Module).filter(Module.id == module_id).first()
        if not module:
            raise ValueError(f"Module with ID {module_id} not found")

        # Get all questions for this module
        questions = db.query(Question).filter(Question.module_id == module_id).order_by(Question.generated_at).all()

        # Get all answers for this module
        answers = db.query(StudentAnswer).filter(StudentAnswer.module_id == module_id).all()

        # Get all feedback
        feedback_map = {}
        feedbacks = db.query(AIFeedback).join(
            StudentAnswer, AIFeedback.answer_id == StudentAnswer.id
        ).filter(StudentAnswer.module_id == module_id).all()

        for fb in feedbacks:
            feedback_map[fb.answer_id] = fb

        # Organize answers by student and question
        student_question_answers = {}
        for answer in answers:
            key = (answer.student_id, str(answer.question_id))
            if key not in student_question_answers:
                student_question_answers[key] = {}
            student_question_answers[key][answer.attempt] = answer

        # Get unique students
        students = sorted(set(answer.student_id for answer in answers))

        # Build export data
        export_data = []

        for student_id in students:
            for question in questions:
                row = {
                    'Student ID': student_id,
                    'Question Text': question.text[:200] + '...' if len(question.text) > 200 else question.text,
                    'Question Type': question.type,
                }

                # Add correct answer
                if question.type == 'mcq':
                    row['Correct Answer'] = question.correct_answer
                elif question.correct_answer:
                    correct_ans_text = question.correct_answer[:200] + '...' if len(str(question.correct_answer)) > 200 else question.correct_answer
                    row['Correct Answer'] = correct_ans_text
                else:
                    row['Correct Answer'] = 'Not specified'

                # Add data for each attempt (up to 5)
                key = (student_id, str(question.id))
                attempts_data = student_question_answers.get(key, {})

                for attempt_num in range(1, 6):  # Attempts 1-5
                    attempt_answer = attempts_data.get(attempt_num)

                    if attempt_answer:
                        # Add answer
                        answer_text = _format_student_answer(attempt_answer.answer)
                        if len(answer_text) > 200:
                            answer_text = answer_text[:200] + '...'
                        row[f'Attempt {attempt_num} Answer'] = answer_text

                        # Add feedback if exists
                        fb = feedback_map.get(attempt_answer.id)
                        if fb:
                            feedback_text = ''
                            if fb.feedback_data:
                                # Extract key feedback info
                                if 'explanation' in fb.feedback_data:
                                    feedback_text = fb.feedback_data['explanation']
                                elif 'feedback' in fb.feedback_data:
                                    feedback_text = fb.feedback_data['feedback']
                                else:
                                    feedback_text = str(fb.feedback_data)

                                if len(feedback_text) > 300:
                                    feedback_text = feedback_text[:300] + '...'

                            row[f'Attempt {attempt_num} Feedback'] = feedback_text
                            row[f'Attempt {attempt_num} Score'] = fb.score if fb.score is not None else 'N/A'
                            row[f'Attempt {attempt_num} Correct'] = 'Yes' if fb.is_correct else 'No' if fb.is_correct is not None else 'N/A'
                        else:
                            row[f'Attempt {attempt_num} Feedback'] = 'No feedback'
                            row[f'Attempt {attempt_num} Score'] = 'N/A'
                            row[f'Attempt {attempt_num} Correct'] = 'N/A'
                    else:
                        row[f'Attempt {attempt_num} Answer'] = 'Not attempted'
                        row[f'Attempt {attempt_num} Feedback'] = ''
                        row[f'Attempt {attempt_num} Score'] = ''
                        row[f'Attempt {attempt_num} Correct'] = ''

                export_data.append(row)

        # Create Excel file
        output = BytesIO()

        if export_data:
            df = pd.DataFrame(export_data)

            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                df.to_excel(writer, sheet_name='Feedback Report', index=False)

                # Auto-fit columns
                worksheet = writer.sheets['Feedback Report']
                for idx, col in enumerate(df.columns):
                    max_length = max(
                        df[col].astype(str).str.len().max(),
                        len(str(col))
                    )
                    adjusted_width = min(max_length + 2, 80)
                    worksheet.set_column(idx, idx, adjusted_width)
        else:
            # Create empty file if no data
            df = pd.DataFrame([{'Message': 'No student data found for this module'}])
            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                df.to_excel(writer, sheet_name='Feedback Report', index=False)

        output.seek(0)
        return output


# Singleton instance
module_export_service = ModuleExportService()
