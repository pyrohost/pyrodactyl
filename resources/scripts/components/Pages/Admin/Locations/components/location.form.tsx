import { Head, usePage, useForm, router } from '@inertiajs/react';
import { toast, Toaster } from 'sonner'
import { 
  Card,
  CardContent, 
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface LocationViewProps {
  location: {
    id: number
    short: string
    long: string
    flag_url: string
    maximum_servers: number
    required_plans: string[]
    required_rank: number
    nodes: Array<{
      id: number
      name: string
      fqdn: string
      servers_count: number
    }>
  }
}

export default function LocationForm({}: LocationViewProps) {
  const { props } = usePage<PageProps>();
  const { auth, companyDesc, location, plans} = props;
  const { data, setData, patch, processing, errors} = useForm({
    short: location.short,
    long: location.long,
    flag_url: location.flag_url,
    maximum_servers: location.maximum_servers,
    required_plans: location.required_plans,
    required_rank: Array.isArray(location.required_rank) ? location.required_rank : []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    patch(`/admin/locations/view/${location.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Location updated successfully')
      },
      onError: () => {
        toast.error('Failed to update location')
      }
    })
  }

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this location?')) return

    

    
    router.delete(`/api/application/locations/${location.id}`, {
        onSuccess: () => {
            toast.success('User deleted successfully')
            window.location.href = '/admin/locations'
        },
        onError: (errors) => toast.error(errors.error || 'Failed to delete user')
    })
    console.log(`/api/application/locations/${location.id}`)

  }

  return (
    <>
      <Head title={`Locations > ${location.short}`} />
      
      
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Short Code</label>
                <Input
                  value={data.short}
                  onChange={e => setData('short', e.target.value)}
                  error={errors.short}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={data.long}
                  onChange={e => setData('long', e.target.value)}
                  error={errors.long}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Flag URL</label>
                <Input
                  type="url"
                  value={data.flag_url}
                  onChange={e => setData('flag_url', e.target.value)}
                  error={errors.flag_url}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Maximum Servers</label>
                <Input
                  type="number"
                  min="0"
                  value={data.maximum_servers}
                  onChange={e => setData('maximum_servers', parseInt(e.target.value))}
                  error={errors.maximum_servers}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Required Ranks</label>
                <div className="space-y-2">
                  {['Free', 'Premium', 'Staff'].map((rank) => (
                    <div key={rank} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`rank-${rank.toLowerCase()}`}
                        checked={data.required_rank.includes(rank.toLowerCase())}
                        onChange={(e) => {
                          const value = rank.toLowerCase();
                          setData('required_rank', 
                            e.target.checked 
                              ? [...data.required_rank, value]
                              : data.required_rank.filter(r => r !== value)
                          );
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor={`rank-${rank.toLowerCase()}`} className="text-sm">
                        {rank}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.required_rank && (
                  <p className="text-sm text-red-500">{errors.required_rank}</p>
                )}
              </div>

              
              <div className="space-y-2">
  <label className="text-sm font-medium">Required Plans</label>
  <select
    multiple
    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
    value={data.required_plans || []}
    onChange={(e) => {
      const selectedPlans = Array.from(e.target.selectedOptions).map(option => option.value);
      setData('required_plans', selectedPlans);
    }}
  >
    {plans.map((plan) => (
      <option key={plan.id} value={plan.name}>
        {plan.name} ({plan.memory}MB RAM, {plan.cpu}% CPU)
      </option>
    ))}
  </select>
  {errors.required_plans && (
    <p className="text-sm text-red-500">{errors.required_plans}</p>
  )}
</div>
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={location.nodes.length > 0 || processing}
              >
                Delete
              </Button>
              <Button type="submit" disabled={processing}>
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>FQDN</TableHead>
                  <TableHead>Servers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {location.nodes.map(node => (
                  <TableRow key={node.id}>
                    <TableCell className="font-mono">{node.id}</TableCell>
                    <TableCell>
                      <a 
                        href={`/admin/nodes/view/${node.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {node.name}
                      </a>
                    </TableCell>
                    <TableCell className="font-mono">{node.fqdn}</TableCell>
                    <TableCell>{node.servers_count}</TableCell>
                  </TableRow>
                ))}
                {location.nodes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-gray-500">
                      No nodes have been created for this location.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}