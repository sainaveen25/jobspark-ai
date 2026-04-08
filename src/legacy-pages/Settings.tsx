import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, User } from "lucide-react";
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

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      visa_status: profile.visa_status,
      experience_years: profile.experience_years,
      preferred_roles: rolesInput.split(",").map((r) => r.trim()).filter(Boolean),
    }).eq("user_id", user.id);

    if (error) toast.error("Failed to save");
    else toast.success("Profile updated!");
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and preferences</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={profile.full_name} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Visa Status</Label>
              <Input placeholder="e.g., H1B, Green Card, US Citizen" value={profile.visa_status} onChange={(e) => setProfile((p) => ({ ...p, visa_status: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Years of Experience</Label>
              <Input type="number" value={profile.experience_years} onChange={(e) => setProfile((p) => ({ ...p, experience_years: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-2">
              <Label>Preferred Roles (comma-separated)</Label>
              <Input placeholder="e.g., Frontend Engineer, Full Stack Developer" value={rolesInput} onChange={(e) => setRolesInput(e.target.value)} />
            </div>
            <Button onClick={handleSave} disabled={loading} className="gradient-primary text-primary-foreground">
              <Save className="w-4 h-4 mr-2" /> {loading ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
