import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Save, User, Briefcase, Target, Loader2, MapPin,
  Plus, X, Globe, GraduationCap, Mail
} from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    visa_status: "",
    experience_years: 0,
    preferred_roles: [] as string[],
  });
  const [rolesInput, setRolesInput] = useState("");
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) {
        setProfile({
          full_name: data.full_name ?? "",
          visa_status: data.visa_status ?? "",
          experience_years: data.experience_years ?? 0,
          preferred_roles: data.preferred_roles ?? [],
        });
        setRolesInput((data.preferred_roles ?? []).join(", "));
      }
    });
  }, [user]);

  const completionScore = (() => {
    let score = 0;
    if (profile.full_name) score += 25;
    if (profile.visa_status) score += 25;
    if (profile.experience_years > 0) score += 25;
    if (profile.preferred_roles.length > 0) score += 25;
    return score;
  })();

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      visa_status: profile.visa_status,
      experience_years: profile.experience_years,
      preferred_roles: profile.preferred_roles,
    }).eq("user_id", user.id);

    if (error) toast.error("Failed to save");
    else toast.success("Profile updated!");
    setLoading(false);
  };

  const addRole = () => {
    const trimmed = newRole.trim();
    if (trimmed && !profile.preferred_roles.includes(trimmed)) {
      setProfile((p) => ({ ...p, preferred_roles: [...p.preferred_roles, trimmed] }));
      setNewRole("");
    }
  };

  const removeRole = (role: string) => {
    setProfile((p) => ({ ...p, preferred_roles: p.preferred_roles.filter((r) => r !== role) }));
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile and job preferences</p>
      </div>

      {/* Completion bar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border border-border/60 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Profile Completion</span>
              <span className="text-sm font-semibold text-primary">{completionScore}%</span>
            </div>
            <Progress value={completionScore} className="h-2" />
            {completionScore < 100 && (
              <p className="text-xs text-muted-foreground mt-2">
                Complete your profile to get better job matches
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Personal Info */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="border border-border/60 bg-card/80">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Full Name</Label>
              <Input
                placeholder="John Doe"
                value={profile.full_name}
                onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
                className="h-10 bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Email</Label>
              <div className="flex items-center gap-2 px-3 h-10 rounded-lg border border-border/60 bg-muted/30">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{user?.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Professional Info */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border border-border/60 bg-card/80">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-primary" />
              </div>
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Years of Experience</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={String(profile.experience_years)}
                  onChange={(e) => setProfile((p) => ({ ...p, experience_years: parseInt(e.target.value) || 0 }))}
                  className="h-10 bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Visa Status</Label>
                <Input
                  placeholder="e.g., H1B, Green Card, US Citizen"
                  value={profile.visa_status}
                  onChange={(e) => setProfile((p) => ({ ...p, visa_status: e.target.value }))}
                  className="h-10 bg-background/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Preferred Roles — Tag UI */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="border border-border/60 bg-card/80">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
              Target Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Add a role..."
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRole())}
                className="h-9 bg-background/50 text-sm"
              />
              <Button variant="outline" size="sm" className="h-9 px-3" onClick={addRole}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.preferred_roles.map((role) => (
                <Badge
                  key={role}
                  variant="secondary"
                  className="gap-1.5 pl-2.5 pr-1.5 py-1 text-xs cursor-default"
                >
                  {role}
                  <button
                    onClick={() => removeRole(role)}
                    className="ml-0.5 hover:bg-muted rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {profile.preferred_roles.length === 0 && (
                <p className="text-xs text-muted-foreground/60 py-2">No roles added yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full h-11 gradient-primary text-primary-foreground shadow-md shadow-primary/20"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save Changes</>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
