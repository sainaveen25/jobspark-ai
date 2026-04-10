"use client";

import { useMemo, useState } from "react";
import { Copy, Download, FileText, Loader2, UploadCloud, WandSparkles, CheckCircle2 } from "lucide-react";
import { toast } from "@/lib/toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

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
  jobs?: { title?: string; company?: string } | null;
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
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [optimizationMessage, setOptimizationMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedResume = useMemo(() => resumes.find((r) => r.id === selectedResumeId), [resumes, selectedResumeId]);

  const uploadResume = async (file: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/resume/upload", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) {
        toast.error(payload.error ?? "Unable to upload resume");
        return;
      }
      setResumes((c) => [payload.resume, ...c]);
      setSelectedResumeId(payload.resume.id);
      toast.success("Resume uploaded and parsed");
    } catch {
      toast.error("Unable to upload resume");
    } finally {
      setUploading(false);
    }
  };

  const runOptimization = async () => {
    setOptimizationMessage(null);
    setOptimizing(true);
    setProgress(0);
    const interval = setInterval(() => setProgress((p) => Math.min(p + Math.random() * 15, 90)), 500);

    try {
      const response = await fetch("/api/resume/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: selectedResumeId, jobId: selectedJobId })
      });
      const payload = await response.json();
      if (!response.ok) {
        const errorText = payload.error ?? "Unable to optimize resume";
        setOptimizationMessage({ type: "error", text: errorText });
        toast.error(errorText);
        return;
      }
      setOptimizedText(payload.optimizedText);
      setMatchScore(payload.matchScore);
      setOptimizationMessage({ type: "success", text: "Resume optimized successfully." });
      toast.success("Resume optimized!");
    } catch {
      setOptimizationMessage({ type: "error", text: "Unable to optimize resume" });
      toast.error("Unable to optimize resume");
    } finally {
      clearInterval(interval);
      setProgress(100);
      setOptimizing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(optimizedText);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadText = () => {
    const blob = new Blob([optimizedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "optimized-resume.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadResume(file);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resume Studio</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload, optimize, and tailor your resume with AI</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Left: Upload + Original */}
        <div className="space-y-4">
          <Card className="border border-border/60 bg-card/90">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-primary" /> Resume Library
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  dragOver ? "border-primary bg-primary/5" : "border-border/80 hover:border-primary/40 bg-muted/10"
                }`}
              >
                <UploadCloud className={`w-6 h-6 mb-1.5 ${dragOver ? "text-primary" : "text-muted-foreground/40"}`} />
                <span className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Drop PDF here or click"}</span>
                <span className="text-[11px] text-muted-foreground/50 mt-0.5">PDF files only</span>
                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadResume(f); }} />
              </label>

              <div className="space-y-1.5">
                {resumes.map((resume) => (
                  <button
                    key={resume.id}
                    onClick={() => setSelectedResumeId(resume.id)}
                    className={`flex items-center gap-3 w-full p-3 rounded-lg text-left transition-all ${
                      selectedResumeId === resume.id ? "bg-primary/8 border border-primary/20" : "hover:bg-muted/30 border border-transparent"
                    }`}
                  >
                    <FileText className={`w-4 h-4 shrink-0 ${selectedResumeId === resume.id ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{resume.filename ?? "Uploaded resume"}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(resume.created_at).toLocaleDateString()}</p>
                    </div>
                    {selectedResumeId === resume.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedResume?.parsed_text && (
            <Card className="border border-border/60 bg-card/90">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Original Resume</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs whitespace-pre-wrap text-muted-foreground max-h-64 overflow-auto p-3 rounded-lg bg-muted/20 border border-border/40">{selectedResume.parsed_text}</pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Optimize + Output */}
        <div className="space-y-4">
          <Card className="border border-border/60 bg-card/90">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2"><WandSparkles className="w-4 h-4 text-primary" /> Optimization</span>
                {matchScore !== null && <Badge variant="secondary" className="text-xs">Match {matchScore}%</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <select value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)} className="h-9 rounded-lg border border-input bg-background/50 px-3 text-sm">
                  {resumes.map((r) => <option key={r.id} value={r.id}>{r.filename ?? "Resume"}</option>)}
                </select>
                <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)} className="h-9 rounded-lg border border-input bg-background/50 px-3 text-sm">
                  {availableJobs.map((j) => <option key={j.id} value={j.id}>{j.title} - {j.company}</option>)}
                </select>
              </div>

              {optimizing && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Optimizing...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              )}

              {optimizationMessage && (
                <p
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    optimizationMessage.type === "success"
                      ? "border-emerald-300/60 bg-emerald-50 text-emerald-700"
                      : "border-destructive/40 bg-destructive/5 text-destructive"
                  }`}
                >
                  {optimizationMessage.text}
                </p>
              )}

              <Button className="w-full h-10 gradient-primary text-primary-foreground" onClick={runOptimization} disabled={!selectedResumeId || !selectedJobId || optimizing}>
                {optimizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <WandSparkles className="w-4 h-4 mr-2" />}
                Optimize Resume
              </Button>
            </CardContent>
          </Card>

          {optimizedText && (
            <Card className="border border-primary/20 bg-card/90">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-primary">Optimized Resume</CardTitle>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" onClick={copyToClipboard} className="text-[11px] h-7">
                      {copied ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadText} className="text-[11px] h-7">
                      <Download className="w-3 h-3 mr-1" /> Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea value={optimizedText} onChange={(e) => setOptimizedText(e.target.value)} className="min-h-[300px] text-xs bg-primary/[0.02] border-primary/10" />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
