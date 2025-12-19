'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import {
  Plus,
  Trash2,
  Info,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Pencil
} from "lucide-react";
import { useState } from "react";

export default function GradingCriteriaEditor({ value, onChange }) {
  const [editingCriterion, setEditingCriterion] = useState(null);

  const criteria = value?.grading_criteria || {};

  const addCriterion = () => {
    const newKey = `criterion_${Object.keys(criteria).length + 1}`;
    const newCriteria = {
      ...criteria,
      [newKey]: {
        name: "New Criterion",
        description: "What should students demonstrate?",
        weight: 25
      }
    };

    onChange({
      ...value,
      grading_criteria: newCriteria
    });
    setEditingCriterion(newKey);
  };

  const updateCriterion = (key, updates) => {
    onChange({
      ...value,
      grading_criteria: {
        ...criteria,
        [key]: {
          ...criteria[key],
          ...updates
        }
      }
    });
  };

  const deleteCriterion = (key) => {
    const newCriteria = { ...criteria };
    delete newCriteria[key];
    onChange({
      ...value,
      grading_criteria: newCriteria
    });
    if (editingCriterion === key) {
      setEditingCriterion(null);
    }
  };

  const distributeEvenly = () => {
    const count = Object.keys(criteria).length;
    if (count === 0) return;

    const evenWeight = Math.floor(100 / count);
    const remainder = 100 - (evenWeight * count);
    const newCriteria = {};

    Object.keys(criteria).forEach((key, index) => {
      const extraWeight = index < remainder ? 1 : 0;
      newCriteria[key] = {
        ...criteria[key],
        weight: evenWeight + extraWeight
      };
    });

    onChange({
      ...value,
      grading_criteria: newCriteria
    });
  };

  const totalWeight = Object.values(criteria).reduce((sum, c) => sum + (c.weight || 0), 0);
  const isWeightValid = Math.abs(totalWeight - 100) < 1;

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Grading Criteria</CardTitle>
              <CardDescription className="text-sm mt-1">
                Define evaluation criteria and their weights
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {Object.keys(criteria).length > 1 && (
                <Button
                  onClick={distributeEvenly}
                  size="sm"
                  variant="outline"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Equal Weights
                </Button>
              )}
              <Button onClick={addCriterion} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Criterion
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weight Status */}
          {Object.keys(criteria).length > 0 && (
            <div className={`mb-6 p-4 rounded-lg border flex items-center justify-between ${
              isWeightValid
                ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
            }`}>
              <div className="flex items-center gap-3">
                {isWeightValid ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                )}
                <div>
                  <p className={`text-sm font-medium ${
                    isWeightValid
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-amber-900 dark:text-amber-100'
                  }`}>
                    {isWeightValid ? 'Weights balanced' : 'Weights must total 100%'}
                  </p>
                </div>
              </div>
              <span className={`text-lg font-semibold px-3 py-1 rounded ${
                isWeightValid
                  ? 'text-green-900 dark:text-green-100'
                  : 'text-amber-900 dark:text-amber-100'
              }`}>
                {totalWeight}%
              </span>
            </div>
          )}

          {Object.keys(criteria).length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground mb-4">No criteria defined yet</p>
              <Button onClick={addCriterion}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Criterion
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 pb-3 border-b text-sm font-medium text-muted-foreground">
                <div className="col-span-3">Name</div>
                <div className="col-span-5">Description</div>
                <div className="col-span-3">Weight</div>
                <div className="col-span-1"></div>
              </div>

              {/* Criteria Rows */}
              {Object.entries(criteria).map(([key, criterion]) => (
                <div key={key}>
                  {editingCriterion === key ? (
                    /* Edit Mode */
                    <div className="p-4 border rounded-lg bg-accent/50 space-y-4">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm mb-2">Name</Label>
                          <Input
                            value={criterion.name || key}
                            onChange={(e) => updateCriterion(key, { name: e.target.value })}
                            placeholder="e.g., Accuracy"
                          />
                        </div>
                        <div>
                          <Label className="text-sm mb-2">Description</Label>
                          <Textarea
                            value={criterion.description || ''}
                            onChange={(e) => updateCriterion(key, { description: e.target.value })}
                            placeholder="e.g., Correctness of the answer"
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label className="text-sm mb-2">Weight (%)</Label>
                          <div className="flex items-center gap-4">
                            <Slider
                              value={[criterion.weight || 0]}
                              onValueChange={([val]) => updateCriterion(key, { weight: val })}
                              min={0}
                              max={100}
                              step={5}
                              className="flex-1"
                            />
                            <span className="text-sm font-medium w-12 text-right">
                              {criterion.weight || 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingCriterion(null)}
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode - Table Row */
                    <div className="grid grid-cols-12 gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors items-center">
                      <div className="col-span-3">
                        <p className="font-medium text-sm">{criterion.name || key}</p>
                      </div>
                      <div className="col-span-5">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {criterion.description || '—'}
                        </p>
                      </div>
                      <div className="col-span-3">
                        <div className="flex items-center gap-3">
                          <Slider
                            value={[criterion.weight || 0]}
                            onValueChange={([val]) => updateCriterion(key, { weight: val })}
                            min={0}
                            max={100}
                            step={5}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium w-12 text-right">
                            {criterion.weight || 0}%
                          </span>
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingCriterion(key)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteCriterion(key)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
