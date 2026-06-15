"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CameraIcon, UserIcon, Loader2Icon, CheckIcon } from "lucide-react";

export default function ProfilePage() {
  const { profile, updateProfile, uploadProfilePicture, loading } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSuccessMessage("");

    const { error } = await updateProfile({ display_name: displayName, bio });
    if (!error) {
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    }
    setIsSaving(false);
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setSuccessMessage("");

    const { error } = await uploadProfilePicture(file);
    if (!error) {
      setSuccessMessage("Profile picture updated!");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
    setIsUploading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 py-12">
        <div className="container mx-auto px-4">
          <Skeleton className="h-10 w-48 mb-8" />
          <Card className="max-w-2xl border-border/50">
            <CardHeader>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-24 rounded-full mx-auto" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 gradient-text">My Profile</h1>

        <Card className="max-w-2xl border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>
              Update your profile information and picture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Success Message */}
            {successMessage && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900">
                <CheckIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{successMessage}</span>
              </div>
            )}

            {/* Profile Picture */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                    <UserIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <label className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
                  {isUploading ? (
                    <Loader2Icon className="h-5 w-5 animate-spin text-primary-foreground" />
                  ) : (
                    <CameraIcon className="h-5 w-5 text-primary-foreground" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
              <p className="text-sm text-muted-foreground">
                Click to change profile picture
              </p>
            </div>

            {/* Profile Form */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Display Name
                </label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Bio</label>
                <Input
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a little about yourself"
                  disabled={!isEditing}
                />
              </div>

              <div className="flex gap-3 pt-4">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex-1"
                    >
                      {isSaving ? (
                        <>
                          <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        if (profile) {
                          setDisplayName(profile.display_name || "");
                          setBio(profile.bio || "");
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} className="flex-1">
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
