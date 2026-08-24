"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useLearningStore } from "@/lib/store/learning-store";
import { profileSettingsSchema } from "@/schemas/profile";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const profile = useLearningStore((s) => s.profile);
  const updateProfile = useLearningStore((s) => s.updateProfile);
  const resetDemoData = useLearningStore((s) => s.resetDemoData);
  const { theme, setTheme } = useTheme();

  const [form, setForm] = useState({
    name: profile.name,
    dailyStudyMinutesTarget: profile.dailyStudyMinutesTarget,
    dailyNewWordsTarget: profile.dailyNewWordsTarget,
    dailyReviewTarget: profile.dailyReviewTarget,
    translationLanguage: profile.translationLanguage,
  });

  function handleSave() {
    const parsed = profileSettingsSchema.safeParse({
      ...form,
      targetTestDate: profile.targetTestDate,
      interfaceLanguage: profile.interfaceLanguage,
      theme: (theme as "light" | "dark" | "system") ?? "system",
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid settings");
      return;
    }
    updateProfile(parsed.data);
    toast.success("Settings saved");
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Study targets, language preferences, and appearance.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Targets</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="minutes">Study minutes / day</Label>
            <Input
              id="minutes"
              type="number"
              value={form.dailyStudyMinutesTarget}
              onChange={(e) => setForm((f) => ({ ...f, dailyStudyMinutesTarget: Number(e.target.value) }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newWords">New words / day</Label>
            <Input
              id="newWords"
              type="number"
              value={form.dailyNewWordsTarget}
              onChange={(e) => setForm((f) => ({ ...f, dailyNewWordsTarget: Number(e.target.value) }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reviews">Reviews / day</Label>
            <Input
              id="reviews"
              type="number"
              value={form.dailyReviewTarget}
              onChange={(e) => setForm((f) => ({ ...f, dailyReviewTarget: Number(e.target.value) }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Language & Appearance</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Translation language</Label>
            <Select
              value={form.translationLanguage}
              onValueChange={(v) => setForm((f) => ({ ...f, translationLanguage: v as "en" | "vi" | "none" }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="vi">Vietnamese</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Theme</Label>
            <Select value={theme ?? "system"} onValueChange={setTheme}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="self-start">Save Settings</Button>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Demo Data</CardTitle>
          <CardDescription>Reset your local demo progress back to the seeded starting point.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => {
              resetDemoData();
              toast.success("Demo data reset");
            }}
          >
            Reset Demo Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
