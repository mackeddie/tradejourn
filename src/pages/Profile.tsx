import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User } from 'lucide-react';

const profileSchema = z.object({
  display_name: z.string().min(2, 'Display name must be at least 2 characters'),
  avatar_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: profile?.display_name || '',
      avatar_url: profile?.avatar_url || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    const { error } = await updateProfile({
      display_name: data.display_name,
      avatar_url: data.avatar_url || null,
    });
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Error updating profile',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    }
  };

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold">Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings
          </p>
        </div>

        <Card className="gradient-card">
          <CardHeader>
            <CardTitle className="font-display">Your Profile</CardTitle>
            <CardDescription>
              Update your display name and avatar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 mb-8">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-lg">{profile?.display_name || 'Trader'}</p>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="avatar_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/avatar.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="gradient-card mt-6">
          <CardHeader>
            <CardTitle className="font-display">Account Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Created</p>
                <p className="font-medium">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
