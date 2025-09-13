# -*- mode: ruby -*-
# vi: set ft=ruby :

BOX_DEFAULT = "ubuntu/jammy64"
BOX_LIBVIRT = "generic/ubuntu2204"

RAM  = (ENV["VM_RAM"]  || "8192").to_i
CPUS = (ENV["VM_CPUS"] || "8").to_i

SPECIAL_PORTS = [
  3000,  # pyrodactyl web ui
  3306,  # database
  8080,  # phpmyadmin
  8025,  # mailpit web ui
  9000,  # minio api
  9001   # minio console
]

TEST_PORTS = (25500..25600)

FORWARDED_PORTS = SPECIAL_PORTS + TEST_PORTS.to_a

Vagrant.configure("2") do |config|
  # Base box and hostname
  config.vm.box      = BOX_DEFAULT
  config.vm.hostname = "pyrodactyl-dev"

  # Forwarded ports
  FORWARDED_PORTS.each do |p|
    config.vm.network "forwarded_port",
      guest: p,
      host:  p,
      host_ip: "127.0.0.1",
      auto_correct: false
  end

  # VirtualBox provider settings
  config.vm.provider "virtualbox" do |vb|
    vb.name   = "pyrodactyl-dev"
    vb.memory = RAM
    vb.cpus   = CPUS
    vb.gui    = false

    vb.customize ["modifyvm", :id, "--cpuexecutioncap", "95"]
    vb.customize ["modifyvm", :id, "--nic1", "nat"]
    vb.customize ["modifyvm", :id, "--nictype1", "virtio"]
  end

  # VMware provider settings
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

  # Libvirt provider settings
  config.vm.provider "libvirt" do |lv, override|
    override.vm.box = BOX_LIBVIRT
    lv.memory = RAM
    lv.cpus   = CPUS
  end

  # Synced folder configuration
  if Vagrant::Util::Platform.windows?
    # Use VirtualBox shared folders on Windows (no authentication)
    config.vm.synced_folder ".", "/var/www/pterodactyl",
      type: "virtualbox",
      owner: "vagrant",
      group: "vagrant",
      mount_options: ["dmode=755", "fmode=644"]
  else
    # Use NFS on Linux/macOS
    config.vm.synced_folder ".", "/var/www/pterodactyl",
      type: "nfs",
      nfs_version: 4,
      nfs_udp: false,
      mount_options: ["rw", "vers=4", "tcp", "fsc", "rsize=1048576", "wsize=1048576"]
  end

  # Provisioning script
  config.vm.provision "shell",
    path: "vagrant/provision.sh",
    keep_color: true,
    privileged: true

  # Helpful post-up message
  config.vm.post_up_message = <<~MSG
    Pyrodactyl is up and running at http://localhost:3000
    Login with:
      username: dev@pyro.host
      password: password
  MSG
end
