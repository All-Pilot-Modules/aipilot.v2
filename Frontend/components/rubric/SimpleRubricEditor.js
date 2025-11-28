'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Lightbulb,
  Sparkles,
  Eye,
  Settings2,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronUp,
  Award,
  FileQuestion,
  MessageSquare,
  Zap,
  FileText
} from "lucide-react";
import { useState } from "react";
import GradingCriteriaEditor from "./GradingCriteriaEditor";
import QuestionTypeSettings from "./QuestionTypeSettings";
import GradingThresholds from "./GradingThresholds";

export default function SimpleRubricEditor({ value, onChange, templates, onApplyTemplate, isApplyingTemplate = false }) {
  const [showPreview, setShowPreview] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [templateFilter, setTemplateFilter] = useState('');
  const [activeTab, setActiveTab] = useState('criteria');

  const tones = [
    { value: 'encouraging', emoji: '😊', label: 'Friendly', description: 'Supportive and positive' },
    { value: 'neutral', emoji: '📊', label: 'Balanced', description: 'Professional and fair' },
    { value: 'strict', emoji: '🎯', label: 'Direct', description: 'Clear and rigorous' }
  ];

  const handleToneSelect = (tone) => {
    onChange({
      ...value,
      feedback_style: {
        ...value?.feedback_style,
        tone: tone
      }
    });
  };

  const handleInstructionsChange = (instructions) => {
    onChange({
      ...value,
      custom_instructions: instructions
    });
  };

  const handleTemplateSelect = (templateKey) => {
    if (onApplyTemplate) {
      onApplyTemplate(templateKey);
    }
  };

  const handleRAGSettingChange = (setting, newValue) => {
    onChange({
      ...value,
      rag_settings: {
        ...value?.rag_settings,
        [setting]: newValue
      }
    });
  };

  const selectedTone = value?.feedback_style?.tone || 'encouraging';
  const instructions = value?.custom_instructions || '';
  const ragSettings = value?.rag_settings || {};

  const filteredTemplates = templates?.filter(template =>
    template.name.toLowerCase().includes(templateFilter.toLowerCase()) ||
    template.description?.toLowerCase().includes(templateFilter.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8">
      {/* Premium Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1.5 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 shadow-lg rounded-xl">
          <TabsTrigger value="criteria" className="gap-2 py-4 px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all duration-300 rounded-lg font-semibold">
            <Award className="w-5 h-5" />
            <span className="hidden sm:inline">Grading Criteria</span>
            <span className="sm:hidden">Criteria</span>
          </TabsTrigger>
          <TabsTrigger value="scoring" className="gap-2 py-4 px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all duration-300 rounded-lg font-semibold">
            <TrendingUp className="w-5 h-5" />
            <span className="hidden sm:inline">Scoring & Points</span>
            <span className="sm:hidden">Scoring</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-2 py-4 px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all duration-300 rounded-lg font-semibold">
            <MessageSquare className="w-5 h-5" />
            <span className="hidden sm:inline">Feedback & Templates</span>
            <span className="sm:hidden">Feedback</span>
          </TabsTrigger>
        </TabsList>

        {/* Grading Criteria Tab */}
        <TabsContent value="criteria" className="space-y-6 mt-6">
          <GradingCriteriaEditor value={value} onChange={onChange} />
        </TabsContent>

        {/* Scoring & Points Tab */}
        <TabsContent value="scoring" className="space-y-6 mt-6">
          <GradingThresholds value={value} onChange={onChange} />
          <QuestionTypeSettings value={value} onChange={onChange} />
        </TabsContent>

        {/* Feedback & Templates Tab */}
        <TabsContent value="feedback" className="space-y-6 mt-6">
          {/* Template Selection */}
          {templates && templates.length > 0 && (
            <Card className="border-2 border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="border-b-2 border-purple-200 dark:border-purple-700 pb-6 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/30">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-purple-900 dark:text-purple-100">
                      Pre-configured Grading Templates
                    </CardTitle>
                    <CardDescription className="text-sm mt-1 text-purple-800 dark:text-purple-300">
                      Apply a template to quickly configure grading criteria and scoring rules
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Template Filter */}
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-500" />
                  <Input
                    placeholder="Search templates..."
                    value={templateFilter}
                    onChange={(e) => setTemplateFilter(e.target.value)}
                    className="pl-12 h-12 text-base border-2 border-purple-200 dark:border-purple-800 focus:border-purple-400 dark:focus:border-purple-600 rounded-xl shadow-sm"
                  />
                </div>

                {isApplyingTemplate ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner size="lg" className="text-primary mr-3" />
                    <p className="text-muted-foreground">Applying template...</p>
                  </div>
                ) : filteredTemplates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredTemplates.map((template) => (
                      <button
                        key={template.key}
                        onClick={() => handleTemplateSelect(template.key)}
                        className="group relative h-auto p-6 rounded-2xl border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-2xl transition-all duration-300 text-left bg-white dark:bg-slate-800 hover:scale-105 hover:-translate-y-1"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative flex flex-col items-start gap-4">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 group-hover:scale-110 transition-transform shadow-md">
                            <span className="text-4xl">
                              {template.key === 'default' && '📚'}
                              {template.key === 'stem_course' && '🔬'}
                              {template.key === 'humanities' && '📖'}
                              {template.key === 'language_learning' && '🌍'}
                              {template.key === 'professional_skills' && '💼'}
                              {template.key === 'strict_grading' && '🎯'}
                            </span>
                          </div>
                          <div className="w-full space-y-2">
                            <p className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {template.name}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {template.description}
                            </p>
                          </div>
                          <Badge className="mt-auto bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                            Click to apply
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No templates found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Info Box */}
          <Card className="border-2 border-indigo-300 dark:border-indigo-700 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-950/30 dark:to-blue-950/20 shadow-lg">
            <CardContent className="pt-6 pb-6">
              <div className="flex gap-5">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow-lg">
                    <Lightbulb className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="space-y-4 flex-1">
                  <p className="font-bold text-indigo-900 dark:text-indigo-100 text-lg">
                    About Templates
                  </p>
                  <ul className="space-y-3 text-indigo-800 dark:text-indigo-200 text-sm">
                    <li className="flex items-start gap-3">
                      <div className="p-1 rounded-lg bg-indigo-200 dark:bg-indigo-800 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-indigo-700 dark:text-indigo-300" />
                      </div>
                      <span className="leading-relaxed">Templates provide pre-configured grading criteria and scoring rules</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1 rounded-lg bg-indigo-200 dark:bg-indigo-800 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-indigo-700 dark:text-indigo-300" />
                      </div>
                      <span className="leading-relaxed">You can customize any template after applying it</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1 rounded-lg bg-indigo-200 dark:bg-indigo-800 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-indigo-700 dark:text-indigo-300" />
                      </div>
                      <span className="leading-relaxed">Or build your own rubric from scratch in the Grading Criteria tab</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6 mt-6">
          {/* Feedback Tone */}
          <Card className="border-2 border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950/30 dark:to-cyan-950/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b-2 border-blue-200 dark:border-blue-700 pb-6 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/30">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-blue-900 dark:text-blue-100">
                    Feedback Tone & Style
                  </CardTitle>
                  <CardDescription className="text-sm mt-1 text-blue-800 dark:text-blue-300">
                    How should the AI communicate with your students?
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tones.map((tone) => (
                  <button
                    key={tone.value}
                    onClick={() => handleToneSelect(tone.value)}
                    className={`group p-7 rounded-2xl border-2 transition-all duration-300 text-left transform hover:scale-105 hover:-translate-y-1 ${
                      selectedTone === tone.value
                        ? 'border-blue-500 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 shadow-2xl ring-4 ring-blue-300 dark:ring-blue-700'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl'
                    }`}
                  >
                    <div className="flex flex-col items-start gap-4">
                      <div className={`p-3 rounded-xl transition-all ${selectedTone === tone.value ? 'bg-blue-200 dark:bg-blue-800/50 scale-110' : 'bg-slate-100 dark:bg-slate-700'}`}>
                        <span className="text-4xl group-hover:scale-110 transition-transform">{tone.emoji}</span>
                      </div>
                      <div className="w-full space-y-2">
                        <div className="flex items-center justify-between">
                          <p className={`font-bold text-lg ${selectedTone === tone.value ? 'text-blue-900 dark:text-blue-100' : 'text-slate-900 dark:text-slate-100'}`}>
                            {tone.label}
                          </p>
                          {selectedTone === tone.value && (
                            <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{tone.description}</p>
                      </div>
                      {selectedTone === tone.value && (
                        <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0 w-full justify-center py-2 shadow-md">
                          ✓ Currently Active
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Instructions */}
          <Card className="border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950/30 dark:to-yellow-950/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b-2 border-amber-200 dark:border-amber-700 pb-6 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/30">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-600 to-yellow-600 shadow-lg">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-amber-900 dark:text-amber-100">
                    Custom Instructions <span className="text-base font-normal text-amber-700 dark:text-amber-300">(Optional)</span>
                  </CardTitle>
                  <CardDescription className="text-sm mt-1 text-amber-800 dark:text-amber-300">
                    Add specific guidance for AI feedback in this module
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3">
                <Textarea
                  value={instructions}
                  onChange={(e) => handleInstructionsChange(e.target.value)}
                  placeholder="Focus on mathematical accuracy and proper methodology. Reference formulas and principles from course materials."
                  rows={5}
                  maxLength={300}
                  className="resize-none transition-all border-2 border-amber-200 dark:border-amber-800 focus:border-amber-400 dark:focus:border-amber-600 focus:ring-4 focus:ring-amber-200/50 dark:focus:ring-amber-800/50 rounded-xl text-base p-4"
                />
                <div className="flex items-center justify-between px-2">
                  <p className="text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2 font-medium">
                    <Lightbulb className="w-4 h-4" />
                    Tell the AI what to focus on when giving feedback
                  </p>
                  <span className={`text-sm font-bold px-3 py-1 rounded-lg transition-colors ${
                    instructions.length > 250
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100'
                  }`}>
                    {instructions.length} / 300
                  </span>
                </div>
              </div>

              {/* Example Instructions */}
              <div className="border-t-2 border-amber-300 dark:border-amber-700 pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-amber-200 dark:bg-amber-800">
                    <Sparkles className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                  </div>
                  <p className="text-base font-bold text-amber-900 dark:text-amber-100">Quick Examples:</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Focus on mathematical accuracy and proper notation',
                    'Emphasize real-world applications and practical examples',
                    'Check grammar, vocabulary, and natural expression',
                    'Evaluate critical thinking and argumentation skills'
                  ].map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleInstructionsChange(example)}
                      className="group text-left p-4 text-sm rounded-xl hover:bg-gradient-to-br hover:from-amber-100 hover:to-yellow-100 dark:hover:from-amber-900/40 dark:hover:to-yellow-900/40 transition-all duration-300 border-2 border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">→</span>
                        <span className="flex-1 leading-relaxed">{example}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Material Settings */}
          <Card className="border-2 border-slate-300 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b-2 border-slate-200 dark:border-slate-700 pb-6 bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-800 dark:to-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-slate-600 to-gray-700 shadow-lg">
                  <Settings2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Course Material Reference Settings
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Control how AI uses your uploaded course materials in feedback
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label className="text-base font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Use Course Materials
                    </Label>
                    <p className="text-sm text-blue-800 dark:text-blue-300 mt-2 leading-relaxed">
                      Reference uploaded course materials when generating feedback
                    </p>
                  </div>
                  <Switch
                    checked={ragSettings?.enabled ?? true}
                    onCheckedChange={(checked) => handleRAGSettingChange('enabled', checked)}
                    className="scale-125"
                  />
                </div>
              </div>

              {ragSettings?.enabled !== false && (
                <>
                  <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border-2 border-slate-200 dark:border-slate-700 shadow-inner hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Document Retrieval
                      </Label>
                      <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-md transition-transform hover:scale-105">
                        {ragSettings?.max_context_chunks || 3} {ragSettings?.max_context_chunks === 1 ? 'chunk' : 'chunks'}
                      </div>
                    </div>
                    <div className="px-2 py-4">
                      <Slider
                        value={[ragSettings?.max_context_chunks || 3]}
                        onValueChange={([value]) => handleRAGSettingChange('max_context_chunks', value)}
                        min={1}
                        max={10}
                        step={1}
                        className="w-full cursor-grab active:cursor-grabbing"
                      />
                    </div>
                    <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400 px-1">
                      <span className="flex flex-col items-start">
                        <span className="font-bold">1</span>
                        <span className="text-[10px]">Minimal</span>
                      </span>
                      <span className="flex flex-col items-center">
                        <span className="font-bold">5</span>
                        <span className="text-[10px]">Balanced</span>
                      </span>
                      <span className="flex flex-col items-end">
                        <span className="font-bold">10</span>
                        <span className="text-[10px]">Maximum</span>
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Number of relevant document sections to retrieve from your course materials
                    </p>
                  </div>

                  <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-200 dark:border-emerald-800 shadow-inner hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-bold text-emerald-900 dark:text-emerald-100">
                        Relevance Threshold
                      </Label>
                      <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-lg shadow-md transition-transform hover:scale-105">
                        {((ragSettings?.similarity_threshold || 0.7) * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="px-2 py-4">
                      <Slider
                        value={[(ragSettings?.similarity_threshold || 0.7) * 100]}
                        onValueChange={([value]) => handleRAGSettingChange('similarity_threshold', value / 100)}
                        min={50}
                        max={95}
                        step={1}
                        className="w-full cursor-grab active:cursor-grabbing"
                      />
                    </div>
                    <div className="flex justify-between text-xs font-medium text-emerald-700 dark:text-emerald-400 px-1">
                      <span className="flex flex-col items-start">
                        <span className="font-bold">50%</span>
                        <span className="text-[10px]">Relaxed</span>
                      </span>
                      <span className="flex flex-col items-center">
                        <span className="font-bold">70%</span>
                        <span className="text-[10px]">Balanced</span>
                      </span>
                      <span className="flex flex-col items-end">
                        <span className="font-bold">95%</span>
                        <span className="text-[10px]">Strict</span>
                      </span>
                    </div>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
                      Minimum relevance score required for including course materials in feedback
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 shadow-inner">
                    <div className="space-y-2 flex-1 mr-6">
                      <Label className="text-base font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Show Source References
                      </Label>
                      <p className="text-sm text-purple-800 dark:text-purple-300 leading-relaxed">
                        Include references to specific course material sections in feedback
                      </p>
                    </div>
                    <Switch
                      checked={ragSettings?.include_source_references ?? true}
                      onCheckedChange={(checked) => handleRAGSettingChange('include_source_references', checked)}
                      className="scale-125"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
