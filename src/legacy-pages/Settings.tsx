import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, User, Briefcase, Target, Loader2, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";

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

  const sections = [
    {
      title: "Personal Info",
      icon: User,
      fields: [
        {
          label: "Full Name",
          description: "Your display name across the platform",
          value: profile.full_name,
          onChange: (v: string) => setProfile((p) => ({ ...p, full_name: v })),
          placeholder: "John Doe",
        },
        {
          label: "Email",
          description: "Your account email address",
          value: user?.email ?? "",
          onChange: () => {},
          disabled: true,
          placeholder: "",
        },
      ],
    },
    {
      title: "Work Preferences",
      icon: Briefcase,
      fields: [
        {
          label: "Visa Status",
          description: "Your current work authorization status",
          value: profile.visa_status,
          onChange: (v: string) => setProfile((p) => ({ ...p, visa_status: v })),
          placeholder: "e.g., H1B, Green Card, US Citizen",
        },
        {
          label: "Years of Experience",
          description: "Total years of professional experience",
          value: String(profile.experience_years),
          onChange: (v: string) => setProfile((p) => ({ ...p, experience_years: parseInt(v) || 0 })),
          type: "number",
          placeholder: "0",
        },
      ],
    },
    {
      title: "Role Preferences",
      icon: Target,
      fields: [
        {
          label: "Preferred Roles",
          description: "Comma-separated list of target job titles",
          value: rolesInput,
          onChange: (v: string) => setRolesInput(v),
          placeholder: "Frontend Engineer, Full Stack Developer",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Settings"
        description="Manage your profile and preferences"
        icon={Settings}
      />

      {sections.map((section, si) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: si * 0.1 }}
        >
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <section.icon className="w-4 h-4 text-primary" />
                </div>
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {section.fields.map((field) => (
                <div key={field.label} className="space-y-1.5">
                  <Label className="text-sm font-medium">{field.label}</Label>
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                  <Input
                    type={field.type ?? "text"}
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    disabled={field.disabled}
                    className="bg-background/50"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      ))}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full gradient-primary text-primary-foreground shadow-md shadow-primary/20"
          size="lg"
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