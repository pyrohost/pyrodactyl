import { useEffect, useState } from 'react'
import { useForm } from '@inertiajs/react'
import { usePage } from '@inertiajs/react'
import { router } from '@inertiajs/react'
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from '@/hooks/use-toast'
import { LucideTrash2 } from 'lucide-react'


interface Plan {
  id: number
  name: string
  description: string
  price: number
}

export default function ManagePlans() {
const { user, plans } = usePage<Props>().props
  
  const [selectedPlan, setSelectedPlan] = useState<number>()
  const {toast} = useToast()

  const form = useForm({
    plan_id: '',
    count: 1
  })

  const deleteForm = useForm<DeleteFormData>({
    plan_id: ''
  })

  // Fetch plans on component mount
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    form.post(`/api/application/users/${user.id}/plans`, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Plan(s) added successfully"
        })
        form.reset()
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to add plan(s)",
          variant: "destructive"
        })
      }
    })
  }

  // Add delete handler to component
const handleDeleteofplan = (planId: string) => {
    router.delete(`/api/application/users/${user.id}/plans`, {
        data: { plan_id: planId },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Plan removed successfully"
            });
        }
    });
};

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>Manage Plans</CardTitle>
        <CardDescription>Add plans to users</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label>Select Plan</label>
            <Select
              value={form.data.plan_id}
              onValueChange={(value) => form.setData('plan_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id.toString()}>
                    {plan.name} - ${plan.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label>Quantity</label>
            <Input
              type="number"
              min="1"
              value={form.data.count}
              onChange={e => form.setData('count', parseInt(e.target.value))}
            />
          </div>

          <Button 
            type="submit" 
            disabled={form.processing}
            className="w-xl items-center justify-center"
          >
            {form.processing ? "Adding..." : "Add Plan(s)"}
          </Button>
        </form>

        {plans.length > 0 && (
          <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Current Plans</h3>
          <div className="grid gap-4">
            {user.purchases_plans?.map((purchasedPlan: PurchasedPlan, index: number) => (
              <Card key={`${purchasedPlan.plan_id}-${index}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{purchasedPlan.name}</h4>
                      <p className="text-sm text-gray-500">Added: {purchasedPlan.added_at}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteofplan(purchasedPlan.plan_id.toString())}
                    >
                      <LucideTrash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}