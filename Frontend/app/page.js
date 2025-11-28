"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, Users, BarChart3, Shield, Zap, Github, Star, BookOpen, TrendingUp, Award, Globe, Lock, Sparkles, ChevronRight, Play, ExternalLink, Plus, FileText, Calendar, Activity, Target, GraduationCap, Rocket, Settings, Bell, Palette, Key, Database, Download, Mail, Smartphone, Eye, UserCircle } from "lucide-react";
import { apiClient } from "@/lib/auth";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);

  // Fetch modules when authenticated - Hook must be called unconditionally
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchModules();
    }
  }, [isAuthenticated, user]);

  const fetchModules = async () => {
    try {
      setLoadingModules(true);
      const teacherId = user?.id || user?.sub;
      if (!teacherId) return;

      const modulesData = await apiClient.get(`/api/modules?teacher_id=${teacherId}`);
      setModules(modulesData || []);
    } catch (error) {
      console.error('Failed to fetch modules:', error);
      setModules([]);
    } finally {
      setLoadingModules(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Calculate current date info for greeting
    const currentHour = new Date().getHours();
    const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-blue-950/10 dark:to-purple-950/10">
        <main id="main-content" className="max-w-7xl mx-auto px-6 py-8">
          {/* Premium Header with Gradient */}
          <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            <div className="relative p-8 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm text-white/80">
                      {greeting}, {user?.role === 'teacher' ? 'Professor' : 'Student'}
                    </p>
                    <Badge className="bg-white/20 backdrop-blur-sm border-white/30 text-white">
                      {user?.role}
                    </Badge>
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 tracking-tight">
                    {user?.username}
                  </h1>
                  <p className="text-base text-white/90">
                    {user?.email}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                  <Button asChild variant="outline" size="lg" className="bg-white/20 hover:bg-white/30 border-white/30 text-white backdrop-blur-sm">
                    <Link href="/settings">
                      <Settings className="w-5 h-5 mr-2" />
                      Settings
                    </Link>
                  </Button>
                  <Button asChild size="lg" className="relative overflow-hidden group bg-white text-indigo-600 hover:bg-white shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300">
                    <Link href="/mymodules">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg blur opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
                      <div className="relative flex items-center">
                        <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                        <span className="font-bold">My Modules</span>
                        <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs rounded-full font-bold animate-pulse">HOT</span>
                      </div>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Grid */}
          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Total Modules */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-white/80 mb-1">Total Modules</p>
                  <p className="text-4xl font-bold text-white">
                    {loadingModules ? '...' : modules.length}
                  </p>
                </div>
              </div>

              {/* Quick Access - My Modules */}
              <Link href="/mymodules" className="block">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Rocket className="w-6 h-6 text-white" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-sm font-medium text-white/80 mb-1">🌟 Featured</p>
                    <p className="text-2xl font-bold text-white">My Modules</p>
                  </div>
                </div>
              </Link>

              {/* Quick Access - Profile */}
              <Link href="/profile" className="block">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <UserCircle className="w-6 h-6 text-white" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-sm font-medium text-white/80 mb-1">👤 Account</p>
                    <p className="text-2xl font-bold text-white">My Profile</p>
                  </div>
                </div>
              </Link>

              {/* Quick Access - Help & Resources */}
              <a href="https://brockportsigai.org" target="_blank" rel="noopener noreferrer" className="block">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <ExternalLink className="w-5 h-5 text-white/60 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                    <p className="text-sm font-medium text-white/80 mb-1">📚 Learn More</p>
                    <p className="text-2xl font-bold text-white">Resources</p>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Modules Section */}
            <section className="lg:col-span-2" aria-labelledby="modules-heading">
              <div className="flex items-center justify-between mb-6">
                <h2 id="modules-heading" className="text-2xl font-bold text-gray-900 dark:text-white">Your Modules</h2>
                {modules.length > 0 && (
                  <Button asChild className="relative overflow-hidden group bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300">
                    <Link href="/mymodules">
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="relative flex items-center">
                        View All Modules
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Link>
                  </Button>
                )}
              </div>

              {loadingModules ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <Card key={i} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-6">
                        <div className="animate-pulse space-y-3">
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : modules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {modules.slice(0, 4).map((moduleItem) => (
                    <Link
                      key={moduleItem.id}
                      href={`/dashboard?module=${encodeURIComponent(moduleItem.name)}`}
                    >
                      <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-300 hover:shadow-2xl cursor-pointer h-full">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700">
                              Active
                            </Badge>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {moduleItem.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                            {moduleItem.description || 'No description available'}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <span className="font-medium text-blue-700 dark:text-blue-300">{moduleItem.student_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                              <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span className="font-medium text-purple-700 dark:text-purple-300">{moduleItem.test_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20 border-2 border-dashed border-indigo-300 dark:border-indigo-700 p-12 text-center">
                    <div className="inline-flex w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
                      <Rocket className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      Create your first module
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-lg">
                      Get started by creating a learning module to track student progress and generate AI insights.
                    </p>
                    <Button asChild size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300">
                      <Link href="/mymodules">
                        <Plus className="mr-2 w-5 h-5" />
                        Create Your First Module
                      </Link>
                    </Button>
                </div>
              )}
            </section>

            {/* Quick Actions & Info Sidebar */}
            <aside className="space-y-6" aria-label="Quick actions and information">
              {/* Featured: My Modules */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 p-6 text-white">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className="bg-white/30 backdrop-blur-sm border-white/40 text-white font-bold">
                      ⭐ MOST IMPORTANT
                    </Badge>
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">My Modules</h3>
                  <p className="text-sm text-white/90 mb-4">
                    The central hub for all your courses. Create, manage, and organize your learning modules here.
                  </p>
                  <Button asChild size="lg" className="w-full bg-white text-orange-600 hover:bg-white/90 font-bold shadow-xl hover:shadow-2xl group">
                    <Link href="/mymodules">
                      <Rocket className="w-5 h-5 mr-2 group-hover:translate-y-[-2px] transition-transform" />
                      Go to My Modules
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
              </div>

              {/* Quick Actions */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild variant="outline" className="w-full justify-start" size="sm">
                    <Link href="/dashboard/students">
                      <Users className="w-4 h-4 mr-2" />
                      Manage Students
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start" size="sm">
                    <Link href="/dashboard/questions">
                      <FileText className="w-4 h-4 mr-2" />
                      Create Assessment
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start" size="sm">
                    <Link href="/dashboard/grading">
                      <Award className="w-4 h-4 mr-2" />
                      Grade Submissions
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    {modules.length > 0 ? (
                      <>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              Module Created
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 text-xs">
                              {modules[0]?.name || 'New module'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              Assessment Due
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 text-xs">
                              Upcoming deadline in 3 days
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                        No recent activity
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tips & Resources */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Getting Started
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    New to the platform? Here are some tips:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Create modules to organize your courses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Use AI to generate assessments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Track student progress in real-time</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </aside>
          </div>

          {/* Platform Insights & Tools Section */}
          <section className="mb-8" aria-labelledby="platform-tools-heading">
            <h2 id="platform-tools-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Platform Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Account Settings */}
              <Link href="/settings">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg cursor-pointer h-full group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          Account Settings
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Manage your profile, preferences, and account configuration
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Profile */}
              <Link href="/profile">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all hover:shadow-lg cursor-pointer h-full group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <UserCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          My Profile
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          View and update your personal information and bio
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Help Center */}
              <Link href="/help">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all hover:shadow-lg cursor-pointer h-full group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          Help Center
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Get help, documentation, and support resources
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Resources & Learn More - Full Width */}
            <a href="https://brockportsigai.org" target="_blank" rel="noopener noreferrer" className="block mt-4">
              <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 border-0 hover:from-indigo-600 hover:to-purple-700 transition-all hover:shadow-xl cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-all">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white">
                          External Resources
                        </h3>
                        <ExternalLink className="w-4 h-4 text-white/80" />
                      </div>
                      <p className="text-sm text-white/90">
                        Visit our research lab for additional learning materials
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          </section>

        </main>
      </div>
    );
  }

  // Landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/80 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <main id="main-content">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
        {/* Background Grid - Optimized */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-cyan-600/10 rounded-full blur-2xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 md:py-32">
          <div className="text-center">
            {/* Open Source Badge */}
            <div className="inline-flex flex-wrap items-center justify-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 text-green-700 dark:text-green-300 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold mb-6 sm:mb-8 border border-green-200/50 dark:border-green-800/50 shadow-lg backdrop-blur-sm">
              <Github className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-center">100% Free & Open Source Forever</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 text-[10px] sm:text-xs">
                MIT License
              </Badge>
            </div>

            {/* Hero Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold text-slate-900 dark:text-white mb-6 sm:mb-8 leading-tight tracking-tight px-2">
              <span className="block">The Future of</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400">
                AI Education
              </span>
            </h1>

            {/* Enhanced Subtitle */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto mb-8 sm:mb-12 leading-relaxed font-normal px-4">
              Open source platform empowering educators with cutting-edge AI analytics, real-time insights, and personalized learning experiences.
              <span className="block sm:inline font-medium text-slate-700 dark:text-slate-200 mt-2 sm:mt-0"> Free forever, community-driven, and built for everyone.</span>
            </p>

            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center mb-8 sm:mb-12 px-4">
              <Button
                asChild
                size="default"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 sm:px-10 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
              >
                <Link href="/sign-in" className="inline-flex items-center justify-center">
                  <Play className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5" />
                  Get Started Free
                  <ArrowRight className="ml-2 sm:ml-3 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="default"
                className="px-6 sm:px-10 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-xl border-2 border-slate-300 dark:border-slate-600 hover:border-green-500 dark:hover:border-green-400 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 w-full sm:w-auto"
              >
                <Link href="https://github.com/All-Pilot-Modules/ai-pilot" target="_blank" className="inline-flex items-center justify-center">
                  <Github className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">View Source Code</span>
                  <span className="sm:hidden">Source Code</span>
                  <ExternalLink className="ml-2 w-3 h-3 sm:w-4 sm:h-4" />
                </Link>
              </Button>
            </div>

            {/* Student Access Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl p-6 sm:p-8 mb-12 sm:mb-16 border border-blue-200 dark:border-blue-800 mx-4">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">
                  Are you a student?
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-4 sm:mb-6 max-w-2xl mx-auto font-normal leading-relaxed px-2">
                  Join a learning module with an access code from your instructor and start taking tests, accessing materials, and tracking your progress.
                </p>
                <Button
                  asChild
                  size="default"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                >
                  <Link href="/join" className="inline-flex items-center justify-center">
                    <BookOpen className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5" />
                    Join a Module
                    <ChevronRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Open Source Indicators */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center items-center gap-4 sm:gap-8 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-12 sm:mb-16 px-4">
              <div className="flex items-center gap-2 justify-center">
                <Github className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                <span className="text-center">MIT License</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                <span className="text-center">Community Driven</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />
                <span className="text-center">100% Free Forever</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
                <span className="text-center">Self-Hostable</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Open Source Stats Section */}
      <div className="bg-white dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {[
              { value: "100%", label: "Free & Open Source", icon: <Github className="w-6 h-6 text-green-600" /> },
              { value: "MIT", label: "License", icon: <Star className="w-6 h-6 text-yellow-600" /> },
              { value: "∞", label: "Always Free", icon: <Globe className="w-6 h-6 text-blue-600" /> },
              { value: "24/7", label: "Community Support", icon: <Users className="w-6 h-6 text-purple-600" /> }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-3">
                  {stat.icon}
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-12 sm:mb-20">
          <Badge variant="outline" className="mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Platform Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 tracking-tight px-2">
            Everything you need to
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              revolutionize education
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed px-4">
            Cutting-edge AI technology meets intuitive design to deliver unprecedented educational insights and outcomes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-20">
          {[
            {
              icon: <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center"><Brain className="w-6 h-6 text-white" /></div>,
              title: "AI-Powered Analytics",
              description: "Advanced machine learning algorithms analyze student performance patterns, predict learning outcomes, and provide actionable insights for personalized education.",
              features: ["Predictive Analytics", "Learning Pattern Recognition", "Performance Forecasting"]
            },
            {
              icon: <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div>,
              title: "Student Journey Management",
              description: "Comprehensive tools to track, manage, and optimize individual student learning journeys with real-time progress monitoring and personalized support.",
              features: ["Individual Progress Tracking", "Learning Path Optimization", "Goal Setting & Monitoring"]
            },
            {
              icon: <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center"><BarChart3 className="w-6 h-6 text-white" /></div>,
              title: "Real-time Dashboards",
              description: "Dynamic, interactive dashboards that update in real-time, providing instant visibility into student progress and institutional performance metrics.",
              features: ["Live Data Visualization", "Custom Reporting", "Interactive Charts"]
            },
            {
              icon: <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center"><BookOpen className="w-6 h-6 text-white" /></div>,
              title: "Smart Module Management",
              description: "Create and manage specialized learning modules with ease. Build custom educational pathways tailored to different learning needs and disabilities.",
              features: ["Module Builder", "IEP Support", "Autism Spectrum Tools"]
            },
            {
              icon: <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center"><Sparkles className="w-6 h-6 text-white" /></div>,
              title: "AI Test Creation & Feedback",
              description: "Effortlessly create tests and assessments with AI assistance. Get instant, personalized feedback for students with intelligent analysis and recommendations.",
              features: ["AI Test Generator", "Instant Feedback", "Smart Assessment"]
            },
            {
              icon: <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center"><Brain className="w-6 h-6 text-white" /></div>,
              title: "Intelligent Q&A System",
              description: "AI-powered assistant that answers questions about tests, modules, and student progress. Get insights and recommendations through natural conversation.",
              features: ["AI Assistant", "Test Analysis", "Progress Insights"]
            },
            {
              icon: <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center"><Shield className="w-6 h-6 text-white" /></div>,
              title: "Enterprise Security",
              description: "Military-grade security ensuring complete student data privacy, FERPA compliance, and enterprise-level data protection with audit trails.",
              features: ["End-to-End Encryption", "FERPA Compliant", "SOC 2 Certified"]
            },
            {
              icon: <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center"><Zap className="w-6 h-6 text-white" /></div>,
              title: "Lightning Fast Performance",
              description: "Cloud-native architecture with global CDN delivers sub-second response times and 99.9% uptime guarantee worldwide for seamless user experience.",
              features: ["Global CDN", "Sub-second Response", "99.9% Uptime SLA"]
            },
            {
              icon: <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center"><TrendingUp className="w-6 h-6 text-white" /></div>,
              title: "Advanced Reporting",
              description: "Generate comprehensive reports with AI-driven insights. Track progress, identify trends, and make data-driven decisions for better educational outcomes.",
              features: ["Custom Reports", "Trend Analysis", "Export Options"]
            }
          ].map((feature, index) => (
            <Card key={index} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-900/50 hover:-translate-y-2 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed font-normal">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.features.map((item, idx) => (
                    <li key={idx} className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                      <ChevronRight className="w-4 h-4 mr-2 text-blue-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Final CTA Section */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-green-900 to-emerald-900 p-8 sm:p-12 md:p-20 text-center mx-2 sm:mx-0">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.1)_25%,rgba(255,255,255,.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,.1)_75%,rgba(255,255,255,.1))] bg-[length:20px_20px] opacity-20"></div>

          <div className="relative z-10">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold mb-6 sm:mb-8 border border-white/20">
              <Github className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-center">Join the Open Source Education Revolution</span>
            </div>

            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 tracking-tight px-2">
              Start using AI Education Pilot
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-300">
                completely free, forever
              </span>
            </h3>

            <p className="text-sm sm:text-base md:text-lg text-green-100 mb-6 sm:mb-10 max-w-3xl mx-auto leading-relaxed font-normal px-4">
              Download, deploy, and customize this open source platform. No accounts, no payments, no limitations.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-stretch sm:items-center mb-6 sm:mb-10 px-4">
              <Button
                asChild
                size="default"
                className="bg-white text-slate-900 hover:bg-green-50 px-6 sm:px-10 py-5 sm:py-6 text-base sm:text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
              >
                <Link href="/sign-up" className="inline-flex items-center justify-center">
                  <Github className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5" />
                  Get Started Now
                  <ArrowRight className="ml-2 sm:ml-3 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </Button>

              <Button
                asChild
                size="default"
                variant="outline"
                className="px-6 sm:px-10 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-xl border-2 text-white border-white/30 hover:bg-white/10 backdrop-blur-sm transition-all duration-300 w-full sm:w-auto"
              >
                <Link href="https://github.com/All-Pilot-Modules/ai-pilot" target="_blank" className="inline-flex items-center justify-center">
                  <Star className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5" />
                  Star on GitHub
                  <ExternalLink className="ml-2 w-3 h-3 sm:w-4 sm:h-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 text-xs sm:text-sm text-green-200 px-4">
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-green-400" />
                <span>Open source forever</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>No registration required</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <span>Self-host anywhere</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8 sm:mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">AI</span>
                </div>
                <span className="text-xl font-bold text-white">AI Education Pilot</span>
              </div>
              <p className="text-slate-400 mb-6 leading-relaxed">
                Empowering educators worldwide with cutting-edge AI analytics and personalized learning insights.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-2">
                  <Github className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-6">Product</h4>
              <ul className="space-y-4 text-sm">
                <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="https://github.com/All-Pilot-Modules/ai-pilot" target="_blank" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="https://github.com/All-Pilot-Modules/ai-pilot#readme" target="_blank" className="hover:text-white transition-colors">API Docs</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-white font-semibold mb-6">Resources</h4>
              <ul className="space-y-4 text-sm">
                <li><Link href="https://github.com/All-Pilot-Modules/ai-pilot" target="_blank" className="hover:text-white transition-colors">GitHub</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="https://github.com/All-Pilot-Modules/ai-pilot/discussions" target="_blank" className="hover:text-white transition-colors">Community</Link></li>
                <li><Link href="/join" className="hover:text-white transition-colors">Join Module</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-6">Company</h4>
              <ul className="space-y-4 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-slate-800 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-xs sm:text-sm text-center md:text-left">
              © 2024 AI Education Pilot. All rights reserved.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Shield className="w-4 h-4 text-green-400" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Lock className="w-4 h-4 text-blue-400" />
                <span>FERPA Certified</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
