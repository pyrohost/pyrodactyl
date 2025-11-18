BOX_DEFAULT = "bento/ubuntu-24.04"
BOX_LIBVIRT = "generic/ubuntu2404"

RAM  = (ENV["VM_RAM"]  || "8192").to_i
CPUS = (ENV["VM_CPUS"] || "8").to_i

SPECIAL_PORTS = [
  3000,  # pyrodactyl web ui
  3306,  # database
  8080,  # elytra daemon
  8081,  # phpmyadmin
  8025,  # mailpit web ui
  9000,  # minio api
  9001   # minio console
]

TEST_PORTS = (25500..25600)

FORWARDED_PORTS = SPECIAL_PORTS + TEST_PORTS.to_a

Vagrant.configure("2") do |config|
  config.vm.box      = BOX_DEFAULT
  config.vm.hostname = "pyrodactyl-dev"
  
  # Add private network for NFS (required on macOS)
  config.vm.network "private_network", type: "dhcp"
  
  FORWARDED_PORTS.each do |p|
    config.vm.network "forwarded_port",
      guest: p,
      host:  p,
      host_ip: "127.0.0.1",
      auto_correct: false
  end

  config.vm.provider "virtualbox" do |vb|
    vb.name   = "pyrodactyl-dev"
    vb.memory = RAM
    vb.cpus   = CPUS
    vb.gui    = false
    vb.customize ["modifyvm", :id, "--cpuexecutioncap", "95"]
    vb.customize ["modifyvm", :id, "--nic1", "nat"]
    vb.customize ["modifyvm", :id, "--nictype1", "virtio"]
    vb.customize ["modifyvm", :id, "--ioapic", "on"]
    vb.customize ["modifyvm", :id, "--pae", "on"]
    vb.customize ["modifyvm", :id, "--largepages", "on"]
    vb.customize ["modifyvm", :id, "--vtxvpid", "on"]
    vb.customize ["modifyvm", :id, "--hwvirtex", "on"]
    vb.customize ["modifyvm", :id, "--nestedpaging", "on"]
  end

  config.vm.provider "vmware_desktop" do |v|
    v.vmx["memsize"]                   = RAM.to_s
    v.vmx["numvcpus"]                  = CPUS.to_s
    v.vmx["tools.upgrade.policy"]      = "manual"
    v.vmx["RemoteDisplay.vnc.enabled"] = "FALSE"
    v.vmx["vhv.enable"]                = "FALSE"
    v.vmx["ethernet0.connectionType"]  = "nat"
    v.vmx["ethernet0.wakeOnPacketTx"]  = "TRUE"
    v.vmx["ethernet0.addressType"]     = "generated"
  end

  config.vm.provider "libvirt" do |lv, override|
    override.vm.box = BOX_LIBVIRT
    lv.memory = RAM
    lv.cpus   = CPUS
  end

  # Use VirtualBox shared folders for maximum compatibility
  config.vm.synced_folder ".", "/home/vagrant/pyrodactyl",
    type: "virtualbox",
    owner: "vagrant",
    group: "vagrant",
    mount_options: ["dmode=775", "fmode=664"]

  config.vm.provision "shell",
    path: "vagrant/provision.sh",
    keep_color: true,
    privileged: true
  config.vm.post_up_message = <<~MSG
    Pyrodactyl is up and running at http://localhost:3000
    Login with:
      username: dev@pyro.host
      password: dev
  MSG

  # Increase boot timeout to 10 minutes for slow boots or first-time setup
  # in seconds 300 = 5 minutes
  config.vm.boot_timeout = 600
  
end
