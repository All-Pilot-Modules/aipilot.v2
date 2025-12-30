"use client";

import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Brain,
  Users,
  BarChart3,
  Shield,
  Zap,
  Github,
  Star,
  BookOpen,
  TrendingUp,
  Award,
  Globe,
  Lock,
  Sparkles,
  ChevronRight,
  Play,
  ExternalLink,
  Plus,
  FileText,
  Calendar,
  Activity,
  Target,
  GraduationCap,
  Rocket,
  Settings,
  Bell,
  Palette,
  Key,
  Database,
  Download,
  Mail,
  Smartphone,
  Eye,
  UserCircle
} from "lucide-react";
import { apiClient } from "@/lib/auth";

export default function DashboardPage({ user }) {
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);

  const fetchModules = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchModules();
    }
  }, [user, fetchModules]);

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
