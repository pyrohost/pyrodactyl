import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import renameServer from '@/api/server/renameServer';

const formSchema = z.object({
  name: z.string().min(1).max(40),
  description: z.string().max(200).optional(),
});

export default function RenameServerDialog() {
  const { server } = usePage().props as { server: { uuid: string, name: string, description?: string } };
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: server.name,
      description: server.description || '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      await renameServer(server.uuid, values.name, values.description);
      toast.success('Server renamed successfully');
      setOpen(false);
      window.location.reload();
    } catch (error) {
      toast.error('Failed to rename server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Server Details</CardTitle>
        <CardDescription>
          Customize your server's identity
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
       
        <img 
                    src="/assets/svgs/spy.svg"
                    alt="Create New"
                    className="w-120 h-60 object-contain"
                />
        <p className="text-sm text-muted-foreground text-center">
          Change your server's display name and add a description to help identify it.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full max-w-xs">
              <Edit2 className="h-4 w-4 mr-2" />
              Rename Server
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Server</DialogTitle>
              <DialogDescription>
                Change your server's name and description.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Server Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}