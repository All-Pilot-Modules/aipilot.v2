'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Award,
  TrendingUp,
  MessageSquare,
  Info,
  CheckCircle2
} from "lucide-react";
import { useState } from "react";
import GradingCriteriaEditor from "./GradingCriteriaEditor";
import QuestionTypeSettings from "./QuestionTypeSettings";
import GradingThresholds from "./GradingThresholds";

export default function SimpleRubricEditor({ value, onChange, templates, onApplyTemplate, isApplyingTemplate = false }) {
  const [templateFilter, setTemplateFilter] = useState('');
  const [activeTab, setActiveTab] = useState('criteria');

  const tones = [
    { value: 'encouraging', label: 'Friendly', description: 'Supportive and positive' },
    { value: 'neutral', label: 'Balanced', description: 'Professional and fair' },
    { value: 'strict', label: 'Direct', description: 'Clear and rigorous' }
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
    <TooltipProvider>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="criteria" className="gap-2">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Grading Criteria</span>
              <span className="sm:hidden">Criteria</span>
            </TabsTrigger>
            <TabsTrigger value="scoring" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Scoring</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Feedback</span>
            </TabsTrigger>
          </TabsList>

          {/* Grading Criteria Tab */}
          <TabsContent value="criteria" className="space-y-6 mt-6">
            <GradingCriteriaEditor value={value} onChange={onChange} />
          </TabsContent>

          {/* Scoring Tab */}
          <TabsContent value="scoring" className="space-y-6 mt-6">
            <GradingThresholds value={value} onChange={onChange} />
            <QuestionTypeSettings value={value} onChange={onChange} />
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6 mt-6">
            {/* Templates */}
            {templates && templates.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">Templates</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        Apply pre-configured rubric templates
                      </CardDescription>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Templates provide pre-configured criteria for different course types</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Search templates..."
                    value={templateFilter}
                    onChange={(e) => setTemplateFilter(e.target.value)}
                    className="max-w-sm"
                  />

                  {filteredTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredTemplates.map((template) => (
                        <button
                          key={template.key}
                          onClick={() => handleTemplateSelect(template.key)}
                          disabled={isApplyingTemplate}
                          className="p-4 rounded-lg border hover:border-primary hover:bg-accent transition-colors text-left disabled:opacity-50"
                        >
                          <p className="font-medium text-sm mb-1">{template.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No templates found</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Feedback Tone */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Feedback Tone</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      Choose how the AI communicates with students
                    </CardDescription>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Tone affects how feedback is presented - supportive, professional, or direct</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {tones.map((tone) => (
                    <button
                      key={tone.value}
                      onClick={() => handleToneSelect(tone.value)}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        selectedTone === tone.value
                          ? 'border-primary bg-accent'
                          : 'hover:border-primary hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-sm">{tone.label}</p>
                        {selectedTone === tone.value && (
                          <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{tone.description}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Custom Instructions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Custom Instructions <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      Add specific guidance for AI feedback
                    </CardDescription>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Provide additional context about what to focus on in feedback</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={instructions}
                  onChange={(e) => handleInstructionsChange(e.target.value)}
                  placeholder="E.g., Focus on mathematical accuracy and proper notation..."
                  rows={4}
                  maxLength={300}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <span className="text-xs text-muted-foreground">
                    {instructions.length} / 300
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Course Materials Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Course Materials</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      Configure how AI uses your course materials
                    </CardDescription>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Control how uploaded documents are referenced in feedback</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Use Course Materials</Label>
                    <p className="text-xs text-muted-foreground">
                      Reference uploaded course materials in feedback
                    </p>
                  </div>
                  <Switch
                    checked={ragSettings?.enabled ?? true}
                    onCheckedChange={(checked) => handleRAGSettingChange('enabled', checked)}
                  />
                </div>

                {ragSettings?.enabled !== false && (
                  <>
                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Document Chunks</Label>
                        <span className="text-sm font-medium px-3 py-1 rounded-md bg-accent">
                          {ragSettings?.max_context_chunks || 3}
                        </span>
                      </div>
                      <Slider
                        value={[ragSettings?.max_context_chunks || 3]}
                        onValueChange={(value) => handleRAGSettingChange('max_context_chunks', value[0])}
                        min={1}
                        max={5}
                        step={1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Number of relevant document sections to reference
                      </p>
                    </div>

                    <div className="flex items-center justify-between py-3 border-t">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Show Source References</Label>
                        <p className="text-xs text-muted-foreground">
                          Include references to specific course sections
                        </p>
                      </div>
                      <Switch
                        checked={ragSettings?.include_source_references ?? true}
                        onCheckedChange={(checked) => handleRAGSettingChange('include_source_references', checked)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
