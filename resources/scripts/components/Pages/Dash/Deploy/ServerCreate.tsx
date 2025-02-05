import { usePage } from '@inertiajs/react'
import { useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

interface Props {
  nodes: {
    id: number
    name: string
    location: string
  }[]
  nests: {
    id: number
    name: string
    eggs: {
      id: number
      name: string
      description: string
      image_url: string
    }[]
  }[]
  user: {
    purchases_plans: {
      [key: string]: {
        cpu: number
        memory: number
        disk: number
        databases: number
        backups: number
        allocations: number
      }
    }
  }
}

export default function Create() {
  const { nodes, nests, auth} = usePage<Props>().props
  const props = usePage().props
  console.log(props)
  console.log(nodes)
  console.log(nests)
  console.log(auth.user)
  const plan = auth.user.purchases_plans['Free Tier']

  const { data, setData, post, processing, errors } = useForm({
    name: '',
    egg_id: '',
    nest_id: '',
    node_id: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/api/inerstia/servers/create')
  }

  return (
    <div className="container mx-auto p-6">
      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Create New Server</h2>
          
          <div className="grid gap-6">
            <div>
              <label className="text-sm font-medium">Server Name</label>
              <Input 
                value={data.name}
                onChange={e => setData('name', e.target.value)}
                error={errors.name}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Location</label>
              <Select 
                value={data.node_id}
                onValueChange={(value) => setData('node_id', value)}
              >
                {nodes.map(node => (
                  <Select.Option key={node.id} value={node.id}>
                    {node.name} - {node.location}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {nests.map(nest => (
                <div key={nest.id}>
                  <h3 className="text-lg font-medium mb-4">{nest.name}</h3>
                  <div className="grid gap-4">
                    {nest.eggs.filter(egg => 
                      egg.description.toLowerCase().includes('server_ready')
                    ).map(egg => (
                      <Card
                        key={egg.id}
                        className={`cursor-pointer ${
                          data.egg_id === egg.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => {
                          setData('egg_id', egg.id)
                          setData('nest_id', nest.id)
                        }}
                      >
                        <div className="p-4">
                          {egg.image_url && (
                            <img 
                              src={egg.image_url}
                              alt={egg.name}
                              className="w-full h-32 object-contain mb-2"
                            />
                          )}
                          <p className="text-center font-medium">{egg.name}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Plan Limits:</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>CPU: {plan.cpu}%</div>
                <div>Memory: {plan.memory}MB</div>
                <div>Disk: {plan.disk}MB</div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={processing || !data.egg_id || !data.node_id}
            >
              {processing ? 'Creating...' : 'Create Server'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}