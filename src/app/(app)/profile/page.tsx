'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthRedirect(); // Ensures user is authenticated
  const { toast } = useToast();

  if (!user || !isAuthenticated) {
    return <p>Loading profile...</p>;
  }

  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };
  
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock update
    toast({ title: "Profile Update", description: "Profile information updated (mock)." });
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">My Profile</CardTitle>
          <CardDescription>View and manage your account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={`https://placehold.co/128x128.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile picture" />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant={user.role === 'admin' ? 'destructive': 'secondary'} className="mt-1 capitalize">{user.role}</Badge>
            </div>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue={user.name} />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue={user.email} disabled />
            </div>
            {user.role === 'teacher' && user.assignedClass && (
              <div>
                <Label htmlFor="assignedClass">Assigned Class</Label>
                <Input id="assignedClass" defaultValue={user.assignedClass} disabled />
              </div>
            )}
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Update Profile (Mock)</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
