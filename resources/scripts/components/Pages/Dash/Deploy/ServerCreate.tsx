

import { usePage } from '@inertiajs/react'
import { useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface Props {
  plan: {
    id: number
    name: string
    cpu: number
    memory: number
    disk: number
    databases: number
    backups: number
    allocations: number
  }
  limits: {
    cpu: number
    memory: number
    disk: number
    servers: number
    allocations: number
    databases: number
    backups: number
  }
  nodes: {
    id: number
    name: string
  }[]
  locations: {
    id: number;
    short: string;
    long: string;
    flag_url: string | null;
}[];
  eggs: {
    id: number
    name: string
    description: string
    image_url: string
    nest_id: number
  }[]
}

export default function Create() {
  const { plan, limits, locations, eggs} = usePage<Props>().props

  const props = usePage<Props>().props

  console.log(props)

  console.log(locations)

  const { data, setData, post, processing, errors } = useForm({
    name: '',
    egg_id: '',
    nest_id: '',
    location_id: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/api/inerstia/servers/create')
  }

  const isValid = data.name && data.egg_id && data.node_id

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
                <select
                    value={data.location_id}
                    onChange={e => setData('location_id', e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700"
                >
                    {locations.map(location => (
                        <option key={location.id} value={location.id}>
                            {location.short} - {location.long}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {eggs.map(egg => (
                <Card
                  key={egg.id}
                  className={`cursor-pointer ${
                    data.egg_id === egg.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    setData('egg_id', egg.id)
                    setData('nest_id', egg.nest_id)
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
                    <p className="text-sm text-gray-500 text-center mt-1">
                      {egg.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Plan Limits:</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>CPU: {limits.cpu}%</div>
                <div>Memory: {limits.memory}MB</div>
                <div>Disk: {limits.disk}MB</div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={processing || !isValid}
              className="w-full"
            >
              {processing ? 'Creating...' : 'Create Server'}
            </Button>

            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>
        </Card>
      </form>
    </div>
  )
}