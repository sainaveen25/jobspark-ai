"use client";

import { useMemo, useState } from "react";
import { Loader2, UploadCloud, WandSparkles } from "lucide-react";
import { toast } from "@/lib/toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface ResumeItem {
  id: string;
  filename: string | null;
  parsed_text: string | null;
  created_at: string;
}

interface JobOption {
  id: string;
  title: string;
  company: string;
}

interface VersionItem {
  id: string;
  optimized_text: string | null;
  match_score: number | null;
  jobs?: {
    title?: string;
    company?: string;
  } | null;
}

export function ResumeStudio({
  initialResumes,
  availableJobs,
  versions
}: {
  initialResumes: ResumeItem[];
  availableJobs: JobOption[];
  versions: VersionItem[];
}) {
  const [resumes, setResumes] = useState(initialResumes);
  const [selectedResumeId, setSelectedResumeId] = useState(initialResumes[0]?.id ?? "");
  const [selectedJobId, setSelectedJobId] = useState(availableJobs[0]?.id ?? "");
  const [optimizedText, setOptimizedText] = useState(versions[0]?.optimized_text ?? "");
  const [matchScore, setMatchScore] = useState<number | null>(versions[0]?.match_score ?? null);
  const [uploading, setUploading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const selectedResume = useMemo(() => resumes.find((resume) => resume.id === selectedResumeId), [resumes, selectedResumeId]);

  const uploadResume = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/resume/upload", {
      method: "POST",
      body: formData
    });
    const payload = await response.json();
    setUploading(false);

    if (!response.ok) {
      toast.error(payload.error ?? "Unable to upload resume");
      return;
    }

    setResumes((current) => [payload.resume, ...current]);
    setSelectedResumeId(payload.resume.id);
    toast.success("Resume uploaded and parsed");
  };

  const runOptimization = async () => {
    setOptimizing(true);
    const response = await fetch("/api/resume/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeId: selectedResumeId, jobId: selectedJobId })
    });
    const payload = await response.json();
    setOptimizing(false);

    if (!response.ok) {
      toast.error(payload.error ?? "Unable to optimize resume");
      return;
    }

    setOptimizedText(payload.optimizedText);
    setMatchScore(payload.matchScore);
    toast.success("Resume optimized successfully");
  };

  return (
    <div className="space-y-6">
      <section className="glass-card p-6">
        <Badge className="rounded-full bg-primary/10 px-4 py-1.5 text-primary">Resume engine</Badge>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Tailor every application without losing signal.</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Upload a PDF, extract the source text, and generate ATS-aware targeted versions using the job description you
          care about.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="glass-card border-white/30">
          <CardHeader>
            <CardTitle>Resume library</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-primary/30 bg-primary/5 px-6 py-10 text-center">
              <UploadCloud className="h-8 w-8 text-primary" />
              <span className="mt-3 text-sm font-medium">Upload PDF resume</span>
              <span className="mt-1 text-xs text-muted-foreground">Strict PDF parsing and secure Supabase storage</span>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) uploadResume(file);
                }}
              />
            </label>

            <div className="space-y-3">
              {resumes.map((resume) => (
                <button
                  key={resume.id}
                  type="button"
                  onClick={() => setSelectedResumeId(resume.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${resume.id === selectedResumeId ? "border-primary bg-primary/5" : "bg-background/70"}`}
                >
                  <p className="font-medium">{resume.filename ?? "Uploaded resume"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{new Date(resume.created_at).toLocaleString()}</p>
                </button>
              ))}
            </div>

            {uploading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading and parsing resume...
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="glass-card border-white/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Optimization workspace
              {matchScore !== null ? <Badge variant="secondary">Match score {matchScore}%</Badge> : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <select value={selectedResumeId} onChange={(event) => setSelectedResumeId(event.target.value)} className="rounded-2xl border border-input bg-background px-4 py-3 text-sm">
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.filename ?? "Uploaded resume"}
                  </option>
                ))}
              </select>
              <select value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)} className="rounded-2xl border border-input bg-background px-4 py-3 text-sm">
                {availableJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.company}
                  </option>
                ))}
              </select>
            </div>

            <Button className="rounded-2xl" onClick={runOptimization} disabled={!selectedResumeId || !selectedJobId || optimizing}>
              {optimizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
              Optimize resume
            </Button>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium">Extracted resume text</p>
                <Textarea value={selectedResume?.parsed_text ?? ""} readOnly className="min-h-[420px] rounded-3xl bg-background/70" />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Optimized output</p>
                <Textarea value={optimizedText} onChange={(event) => setOptimizedText(event.target.value)} className="min-h-[420px] rounded-3xl bg-background/70" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
