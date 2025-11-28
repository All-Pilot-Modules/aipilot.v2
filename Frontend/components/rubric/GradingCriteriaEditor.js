'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  GripVertical,
  AlertCircle,
  CheckCircle2,
  Award,
  Target,
  Shuffle,
  Lock,
  Unlock,
  Zap,
  BarChart3
} from "lucide-react";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

export default function GradingCriteriaEditor({ value, onChange }) {
  const [expandedCriterion, setExpandedCriterion] = useState(null);
  const [autoBalance, setAutoBalance] = useState(true);
  const [lockedWeights, setLockedWeights] = useState({});

  const criteria = value?.grading_criteria || {};

  const distributeEvenly = () => {
    const count = Object.keys(criteria).length;
    if (count === 0) return;

    const evenWeight = Math.floor(100 / count);
    const remainder = 100 - (evenWeight * count);
    const newCriteria = {};

    Object.keys(criteria).forEach((key, index) => {
      // Distribute remainder to first few criteria
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

  const addCriterion = () => {
    const newKey = `criterion_${Object.keys(criteria).length + 1}`;
    const newCriteria = {
      ...criteria,
      [newKey]: {
        name: "New Criterion",
        description: "What should students demonstrate in their answers?",
        weight: 25
      }
    };

    onChange({
      ...value,
      grading_criteria: newCriteria
    });
  };

  const updateCriterion = (key, updates) => {
    const newCriteria = {
      ...criteria,
      [key]: {
        ...criteria[key],
        ...updates
      }
    };

    // If auto-balance is enabled and weight is being updated
    if (autoBalance && updates.weight !== undefined && !lockedWeights[key]) {
      const targetWeight = updates.weight;
      const currentWeight = criteria[key]?.weight || 0;
      const difference = targetWeight - currentWeight;

      // Get unlocked criteria (excluding the current one)
      const unlockedKeys = Object.keys(newCriteria).filter(k => k !== key && !lockedWeights[k]);

      if (unlockedKeys.length > 0) {
        // Calculate total unlocked weight
        const totalUnlockedWeight = unlockedKeys.reduce((sum, k) => sum + (newCriteria[k]?.weight || 0), 0);

        if (totalUnlockedWeight > 0) {
          // Redistribute proportionally among unlocked criteria
          unlockedKeys.forEach(k => {
            const proportion = (newCriteria[k]?.weight || 0) / totalUnlockedWeight;
            const adjustment = Math.round(difference * proportion);
            newCriteria[k] = {
              ...newCriteria[k],
              weight: Math.max(0, Math.min(100, (newCriteria[k]?.weight || 0) - adjustment))
            };
          });
        } else {
          // Distribute evenly among unlocked
          const perCriterion = Math.floor((100 - targetWeight) / unlockedKeys.length);
          unlockedKeys.forEach(k => {
            newCriteria[k] = {
              ...newCriteria[k],
              weight: perCriterion
            };
          });
        }
      }
    }

    onChange({
      ...value,
      grading_criteria: newCriteria
    });
  };

  const toggleLock = (key) => {
    setLockedWeights(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const setPrimarySecondary = () => {
    const keys = Object.keys(criteria);
    if (keys.length < 2) return;

    const newCriteria = {};
    const primaryWeight = 50;
    const secondaryWeight = Math.floor(50 / (keys.length - 1));
    const remainder = 50 - (secondaryWeight * (keys.length - 1));

    keys.forEach((key, index) => {
      newCriteria[key] = {
        ...criteria[key],
        weight: index === 0 ? primaryWeight + remainder : secondaryWeight
      };
    });

    onChange({
      ...value,
      grading_criteria: newCriteria
    });
  };

  const setTieredWeights = () => {
    const keys = Object.keys(criteria);
    if (keys.length < 3) return;

    const weights = [40, 30, 20, 10]; // Decreasing weights
    const newCriteria = {};

    keys.forEach((key, index) => {
      const weight = weights[index] || 10;
      newCriteria[key] = {
        ...criteria[key],
        weight: weight
      };
    });

    // Adjust to make sure it totals 100
    const total = Object.values(newCriteria).reduce((sum, c) => sum + c.weight, 0);
    if (total !== 100 && keys.length > 0) {
      newCriteria[keys[0]].weight += (100 - total);
    }

    onChange({
      ...value,
      grading_criteria: newCriteria
    });
  };

  const updateCriterionLevel = (criterionKey, level, updates) => {
    onChange({
      ...value,
      grading_criteria: {
        ...criteria,
        [criterionKey]: {
          ...criteria[criterionKey],
          levels: {
            ...criteria[criterionKey].levels,
            [level]: {
              ...criteria[criterionKey].levels[level],
              ...updates
            }
          }
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
  };

  const totalWeight = Object.values(criteria).reduce((sum, c) => sum + (c.weight || 0), 0);
  const isWeightValid = Math.abs(totalWeight - 100) < 1;
  const remainingWeight = 100 - totalWeight;

  return (
    <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/30 to-teal-50/20 dark:from-emerald-950/20 dark:to-teal-950/10 shadow-lg">
      <CardHeader className="border-b-2 border-emerald-200 dark:border-emerald-700 bg-gradient-to-r from-emerald-100/50 to-teal-100/50 dark:from-emerald-900/40 dark:to-teal-900/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                Grading Criteria
              </CardTitle>
              <CardDescription className="text-emerald-800 dark:text-emerald-300 mt-1">
                Define what aspects of student answers will be evaluated and their relative importance
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={addCriterion}
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
            {Object.keys(criteria).length > 1 && (
              <>
                <Button
                  onClick={distributeEvenly}
                  size="lg"
                  variant="outline"
                  className="border-2 border-blue-500 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 shadow-md hover:shadow-lg transition-all"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Equal
                </Button>
                {Object.keys(criteria).length >= 2 && (
                  <Button
                    onClick={setPrimarySecondary}
                    size="lg"
                    variant="outline"
                    className="border-2 border-purple-500 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 shadow-md hover:shadow-lg transition-all"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    50/50
                  </Button>
                )}
                {Object.keys(criteria).length >= 3 && (
                  <Button
                    onClick={setTieredWeights}
                    size="lg"
                    variant="outline"
                    className="border-2 border-orange-500 dark:border-orange-600 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/30 shadow-md hover:shadow-lg transition-all"
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Tiered
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auto-Balance Toggle */}
        {Object.keys(criteria).length > 1 && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/20 border-2 border-indigo-300 dark:border-indigo-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500 dark:bg-indigo-600">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <Label className="text-sm font-bold text-indigo-900 dark:text-indigo-100 cursor-pointer">
                    Auto-Balance Weights
                  </Label>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                    Automatically redistribute weights when you adjust a slider
                  </p>
                </div>
              </div>
              <Switch
                checked={autoBalance}
                onCheckedChange={setAutoBalance}
                className="scale-125"
              />
            </div>
          </div>
        )}

        {/* Remaining Weight Display */}
        {Object.keys(criteria).length > 0 && (
          <div className={`p-6 rounded-xl border-2 shadow-lg transition-all duration-300 ${
            isWeightValid
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-green-400 dark:border-green-600'
              : remainingWeight < 0
                ? 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 border-red-400 dark:border-red-600'
                : 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border-amber-400 dark:border-amber-600'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl shadow-md ${
                  isWeightValid
                    ? 'bg-green-500 dark:bg-green-600'
                    : 'bg-amber-500 dark:bg-amber-600'
                }`}>
                  {isWeightValid ? (
                    <CheckCircle2 className="w-7 h-7 text-white" />
                  ) : (
                    <AlertCircle className="w-7 h-7 text-white" />
                  )}
                </div>
                <div>
                  <p className={`font-bold text-lg ${
                    isWeightValid
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-amber-900 dark:text-amber-100'
                  }`}>
                    {isWeightValid ? '✓ Weights Balanced!' : '⚠ Adjust Weights'}
                  </p>
                  <p className={`text-sm mt-1 ${
                    isWeightValid
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-amber-700 dark:text-amber-300'
                  }`}>
                    {isWeightValid
                      ? 'All criteria weights total exactly 100%'
                      : `You have ${Math.abs(remainingWeight).toFixed(0)}% ${remainingWeight > 0 ? 'remaining to distribute' : 'over the limit'}`
                    }
                  </p>
                </div>
              </div>
              <div className={`px-6 py-3 rounded-xl shadow-lg font-bold text-3xl ${
                isWeightValid
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                  : remainingWeight < 0
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
                    : 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white'
              }`}>
                {remainingWeight >= 0 ? '+' : ''}{remainingWeight.toFixed(0)}%
              </div>
            </div>
          </div>
        )}

        {Object.keys(criteria).length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-xl bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/10 dark:to-teal-950/10">
            <div className="mb-4 p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 w-20 h-20 flex items-center justify-center mx-auto">
              <Target className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-emerald-900 dark:text-emerald-100 font-semibold mb-2 text-lg">No grading criteria defined yet</p>
            <p className="text-emerald-700 dark:text-emerald-300 mb-6 text-sm">Create your first criterion to start building your grading rubric</p>
            <Button
              onClick={addCriterion}
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Criterion
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(criteria).map(([key, criterion]) => (
              <Card
                key={key}
                className="border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 bg-white dark:bg-slate-900 shadow-md hover:shadow-xl"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 cursor-move transition-colors">
                      <GripVertical className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <Label className="text-sm font-bold mb-2 block text-slate-900 dark:text-slate-100">Criterion Name</Label>
                          <Input
                            value={criterion.name || key}
                            onChange={(e) => updateCriterion(key, { name: e.target.value })}
                            placeholder="e.g., Correctness, Clarity, Depth of Analysis"
                            className="text-base border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-600 transition-colors"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCriterion(key)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 mt-6 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>

                      <div>
                        <Label className="text-sm font-bold mb-2 block text-slate-900 dark:text-slate-100">
                          What to look for in student answers
                        </Label>
                        <Textarea
                          value={criterion.description || ''}
                          onChange={(e) => updateCriterion(key, { description: e.target.value })}
                          placeholder="e.g., Student provides accurate information with proper citations and demonstrates understanding of key concepts"
                          rows={3}
                          className="resize-none border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-600 transition-colors"
                        />
                      </div>

                      <div className="pt-2 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-bold text-blue-900 dark:text-blue-100">
                              Importance Weight
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleLock(key)}
                              className={`h-7 w-7 p-0 ${
                                lockedWeights[key]
                                  ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
                                  : 'text-slate-400 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-500'
                              }`}
                              title={lockedWeights[key] ? 'Unlock weight (allows auto-balance)' : 'Lock weight (prevents auto-balance)'}
                            >
                              {lockedWeights[key] ? (
                                <Lock className="w-4 h-4" />
                              ) : (
                                <Unlock className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-base px-4 py-1.5 border-0 shadow-md transition-transform hover:scale-105">
                            {(criterion.weight || 0).toFixed(0)}%
                          </Badge>
                        </div>
                        <div className="px-2 py-4">
                          <Slider
                            value={[criterion.weight || 0]}
                            onValueChange={([val]) => updateCriterion(key, { weight: val })}
                            min={0}
                            max={Math.min(100, (criterion.weight || 0) + remainingWeight)}
                            step={1}
                            className="w-full cursor-grab active:cursor-grabbing"
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2 px-1">
                          <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">
                            How much this criterion counts toward the final grade
                          </p>
                          <p className="text-xs font-bold text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                            Max: {Math.min(100, (criterion.weight || 0) + remainingWeight).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
