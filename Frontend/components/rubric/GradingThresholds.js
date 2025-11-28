'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

export default function GradingThresholds({ value, onChange }) {
  const thresholds = value?.grading_thresholds || {
    passing_score: 60,
    partial_credit: true
  };

  const handleThresholdChange = (key, newValue) => {
    onChange({
      ...value,
      grading_thresholds: {
        ...thresholds,
        [key]: newValue
      }
    });
  };

  const passingScore = thresholds.passing_score || 60;
  const partialCredit = thresholds.partial_credit ?? true;

  return (
    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50/30 to-emerald-50/20 dark:from-green-950/20 dark:to-emerald-950/10 dark:border-green-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          <CardTitle>Scoring Rules</CardTitle>
        </div>
        <CardDescription>
          Set passing criteria and scoring options for student work
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Passing Score */}
        <div className="space-y-4 p-6 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-bold text-green-900 dark:text-green-100">Passing Score</Label>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Minimum score required for students to pass
              </p>
            </div>
            <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-2xl px-5 py-2.5 border-0 shadow-md transition-transform hover:scale-105">
              {passingScore}%
            </Badge>
          </div>
          <div className="px-2 py-4">
            <Slider
              value={[passingScore]}
              onValueChange={([val]) => handleThresholdChange('passing_score', val)}
              min={0}
              max={100}
              step={1}
              className="w-full cursor-grab active:cursor-grabbing"
            />
          </div>
          <div className="flex justify-between text-xs font-medium text-green-700 dark:text-green-400 pt-2 px-1">
            <span className="flex flex-col items-start">
              <span className="font-bold">0%</span>
              <span className="text-[10px]">Fail all</span>
            </span>
            <span className="flex flex-col items-center">
              <span className="font-bold">50%</span>
              <span className="text-[10px]">Half credit</span>
            </span>
            <span className="flex flex-col items-end">
              <span className="font-bold">100%</span>
              <span className="text-[10px]">Perfect only</span>
            </span>
          </div>
        </div>

        {/* Partial Credit */}
        <div className="p-6 rounded-lg bg-card border-2">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <Label className="text-base font-semibold">Allow Partial Credit</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Students can earn points even if their answer is partially correct
                </p>
              </div>
            </div>
            <Switch
              checked={partialCredit}
              onCheckedChange={(val) => handleThresholdChange('partial_credit', val)}
              className="scale-110"
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
          <div className="flex gap-3">
            <Award className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-900 dark:text-green-100 mb-1">
                How Scoring Works
              </p>
              <p className="text-green-700 dark:text-green-300 text-xs">
                The AI evaluates each criterion you defined and calculates a weighted score.
                {partialCredit
                  ? ' Students get credit for partially correct answers.'
                  : ' Students only get credit for fully correct answers.'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
