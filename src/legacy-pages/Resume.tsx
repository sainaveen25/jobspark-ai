import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, FileText, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Resume() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Array<{ id: string; file_url: string | null; parsed_text: string | null; created_at: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [optimizedText, setOptimizedText] = useState("");
  const [selectedResume, setSelectedResume] = useState<string | null>(null);

  const fetchResumes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("resumes").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setResumes(data);
  }, [user]);

  useEffect(() => { fetchResumes(); }, [fetchResumes]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
    try {
      const response = await supabase.functions.invoke("optimize-resume", {
        body: { resume_text: resume.parsed_text, job_description: jobDescription },
      });

      if (response.error) throw response.error;
      setOptimizedText(response.data.optimized_text || "Optimization complete.");
      toast.success("Resume optimized!");
    } catch (err) {
      toast.error("Optimization failed. Make sure the edge function is deployed.");
      console.error(err);
    }
    setOptimizing(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-display font-bold">Resume</h1>
        <p className="text-muted-foreground mt-1">Upload and optimize your resume with AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" /> Upload Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-muted/30">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Click to upload PDF"}</span>
                <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>

              {resumes.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Your Resumes</p>
                  {resumes.map((resume) => (
                    <div
                      key={resume.id}
                      onClick={() => setSelectedResume(resume.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedResume === resume.id ? "bg-primary/10 border border-primary/30" : "bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      <FileText className="w-4 h-4 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">Resume</p>
                        <p className="text-xs text-muted-foreground">{new Date(resume.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> AI Optimization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Job Description</label>
                <Textarea
                  placeholder="Paste the job description here..."
                  className="min-h-[120px] resize-none"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>
              <Button
                onClick={handleOptimize}
                disabled={optimizing || !selectedResume}
                className="w-full gradient-primary text-primary-foreground"
              >
                {optimizing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Optimizing...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Optimize Resume</>
                )}
              </Button>

              {optimizedText && (
                <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm font-medium mb-2">Optimized Resume</p>
                  <pre className="text-xs whitespace-pre-wrap text-muted-foreground max-h-64 overflow-auto">{optimizedText}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
