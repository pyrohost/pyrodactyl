import { usePage } from '@inertiajs/react'
import { useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'

export default function Create() {
  const { nests, user } = usePage().props

  const { data, setData, post, processing } = useForm({
    name: '',
    egg_id: '',
    nest_id: '',
    cpu: user.available.cpu,
    memory: user.available.memory,
    disk: user.available.disk,
    databases: user.available.databases,
    backups: user.available.backups
  })

  return (
    <div className="container mx-auto p-6">
      <form onSubmit={e => {
        e.preventDefault()
        post('/api/client/servers')
      }}>
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Create New Server</h2>
          
          <div className="grid gap-6">
            <div>
              <label className="text-sm font-medium">Server Name</label>
              <Input 
                value={data.name}
                onChange={e => setData('name', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {nests.map(nest => (
                <div key={nest.id}>
                  <h3 className="text-lg font-medium mb-4">{nest.name}</h3>
                  <div className="grid gap-4">
                    {nest.eggs.map(egg => (
                      <Card
                        key={egg.id}
                        className={`cursor-pointer ${data.egg_id === egg.id ? 'ring-2 ring-primary' : ''}`}
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

            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium">CPU (%)</label>
                <Slider
                  value={[data.cpu]}
                  max={user.available.cpu}
                  step={1}
                  onValueChange={([value]) => setData('cpu', value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Memory (MB)</label>
                <Slider
                  value={[data.memory]}
                  max={user.available.memory}
                  step={64}
                  onValueChange={([value]) => setData('memory', value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Disk (MB)</label>
                <Slider
                  value={[data.disk]}
                  max={user.available.disk}
                  step={100}
                  onValueChange={([value]) => setData('disk', value)}
                />
              </div>
            </div>

            <Button disabled={processing}>
              {processing ? 'Creating...' : 'Create Server'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}