import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, FileText, Sparkles, Loader2, Copy, Download, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Progress } from "@/components/ui/progress";

export default function Resume() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Array<{ id: string; file_url: string | null; parsed_text: string | null; created_at: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeProgress, setOptimizeProgress] = useState(0);
  const [jobDescription, setJobDescription] = useState("");
  const [optimizedText, setOptimizedText] = useState("");
  const [selectedResume, setSelectedResume] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fetchResumes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("resumes").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setResumes(data);
  }, [user]);

  useEffect(() => { fetchResumes(); }, [fetchResumes]);

  const handleUpload = async (file: File) => {
    if (!file || !user) return;
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    setUploading(true);
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("resumes").upload(filePath, file);

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("resumes").insert({
      user_id: user.id,
      file_url: urlData.publicUrl,
      parsed_text: "Resume uploaded. Text parsing will be available with AI integration.",
    });

    if (insertError) toast.error("Failed to save resume record");
    else {
      toast.success("Resume uploaded!");
      fetchResumes();
    }
    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleOptimize = async () => {
    if (!selectedResume || !jobDescription.trim()) {
      toast.error("Select a resume and paste a job description");
      return;
    }

    const resume = resumes.find((r) => r.id === selectedResume);
    if (!resume?.parsed_text) {
      toast.error("Resume has no parsed text");
      return;
    }

    setOptimizing(true);
    setOptimizeProgress(0);
    const interval = setInterval(() => {
      setOptimizeProgress((p) => Math.min(p + Math.random() * 15, 90));
    }, 500);

    try {
      const response = await supabase.functions.invoke("optimize-resume", {
        body: { resume_text: resume.parsed_text, job_description: jobDescription },
      });

      if (response.error) throw response.error;
      setOptimizedText(response.data.optimized_text || "Optimization complete.");
      setOptimizeProgress(100);
      toast.success("Resume optimized!");
    } catch (err) {
      toast.error("Optimization failed. Make sure the edge function is deployed.");
      console.error(err);
    }
    clearInterval(interval);
    setOptimizing(false);
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

  const selectedResumeData = resumes.find((r) => r.id === selectedResume);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Resume Studio"
        description="Upload, optimize, and tailor your resume with AI"
        icon={FileText}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upload + Select */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" /> Upload Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/40 bg-muted/20"
                }`}
              >
                <Upload className={`w-8 h-8 mb-2 transition-colors ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-sm text-muted-foreground font-medium">
                  {uploading ? "Uploading..." : "Drop PDF here or click to upload"}
                </span>
                <span className="text-xs text-muted-foreground/60 mt-1">PDF files only</span>
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} disabled={uploading} />
              </label>

              {resumes.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Resumes</p>
                  {resumes.map((resume) => (
                    <button
                      key={resume.id}
                      onClick={() => setSelectedResume(resume.id)}
                      className={`flex items-center gap-3 w-full p-3 rounded-lg text-left transition-all ${
                        selectedResume === resume.id
                          ? "bg-primary/10 border border-primary/30 shadow-sm"
                          : "bg-muted/30 hover:bg-muted/50 border border-transparent"
                      }`}
                    >
                      <FileText className={`w-4 h-4 shrink-0 ${selectedResume === resume.id ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">Resume</p>
                        <p className="text-xs text-muted-foreground">{new Date(resume.created_at).toLocaleDateString()}</p>
                      </div>
                      {selectedResume === resume.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Original resume text */}
          {selectedResumeData?.parsed_text && (
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Original Resume</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs whitespace-pre-wrap text-muted-foreground max-h-64 overflow-auto p-3 rounded-lg bg-muted/30 border border-border/50">
                  {selectedResumeData.parsed_text}
                </pre>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Right: Optimize + Result */}
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> AI Optimization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Job Description
                </label>
                <Textarea
                  placeholder="Paste the target job description here..."
                  className="min-h-[140px] resize-none text-sm"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              {optimizing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Optimizing with AI...</span>
                    <span>{Math.round(optimizeProgress)}%</span>
                  </div>
                  <Progress value={optimizeProgress} className="h-1.5" />
                </div>
              )}

              <Button
                onClick={handleOptimize}
                disabled={optimizing || !selectedResume}
                className="w-full gradient-primary text-primary-foreground shadow-md shadow-primary/20"
              >
                {optimizing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Optimizing...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Optimize Resume</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Optimized result */}
          {optimizedText && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="glass-card border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-primary">Optimized Resume</CardTitle>
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="sm" onClick={copyToClipboard} className="text-xs h-8">
                        {copied ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadText} className="text-xs h-8">
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs whitespace-pre-wrap text-foreground max-h-80 overflow-auto p-4 rounded-lg bg-primary/[0.03] border border-primary/10">
                    {optimizedText}
                  </pre>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}