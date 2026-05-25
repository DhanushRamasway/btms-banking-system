import React from "react";
import { Link, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRegister } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { setToken, token } = useAuth();
  const { toast } = useToast();
  React.useEffect(() => { if (token) setLocation("/dashboard"); }, [token]);

  const form = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema), defaultValues: { fullName: "", email: "", phone: "", password: "" } });
  const passwordValue = form.watch("password");
  const calcStrength = (p: string) => { let s = 0; if (!p) return 0; if (p.length > 8) s += 25; if (p.match(/[a-z]/) && p.match(/[A-Z]/)) s += 25; if (p.match(/\d/)) s += 25; if (p.match(/[^a-zA-Z\d]/)) s += 25; return s; };
  const strength = calcStrength(passwordValue);
  const registerMutation = useRegister();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await registerMutation.mutateAsync({ data: values });
      setToken(response.token);
      toast({ title: "Registration successful", description: "Welcome to BTMS." });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Registration failed", description: error.message || "Could not create account. Please try again." });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2"><Building2 className="w-6 h-6 text-primary" /></div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create an Account</CardTitle>
          <CardDescription>Join BTMS to manage your banking transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email Address</FormLabel><FormControl><Input placeholder="name@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+1 (555) 000-0000" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                  <div className="space-y-1 mt-2">
                    <Progress value={strength} className="h-1" />
                    <p className="text-xs text-muted-foreground text-right">{strength < 25 ? "Very Weak" : strength < 50 ? "Weak" : strength < 75 ? "Fair" : strength < 100 ? "Good" : "Strong"}</p>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full mt-6" size="lg" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Creating Account..." : "Register"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4 mt-2">
          <p className="text-sm text-muted-foreground">Already have an account?{" "}<Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}
