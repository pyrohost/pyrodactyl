Vagrant.configure("2") do |config|
  # Fallback box for other providers
  config.vm.box = "ubuntu/jammy64"
  config.vm.hostname = "pyrodactyl-dev"

  ram  = (ENV["VM_RAM"]  || "8192").to_i
  cpus = (ENV["VM_CPUS"] || "8").to_i

  forwarded_ports = [
    3000,  # app
    3306,  # database
    8080,  # alt-http
    25565, # test ports...
    25566,
    25567
  ]

  forwarded_ports.each do |p|
    config.vm.network "forwarded_port",
      guest: p,
      host:  p,
      host_ip: "127.0.0.1",
      auto_correct: false
  end

  config.vm.provider "virtualbox" do |vb, override|
    override.vm.box = "ubuntu/jammy64"
    vb.name   = "pyrodactyl-dev"
    vb.memory = ram
    vb.cpus   = cpus
    vb.gui    = false

    vb.customize ["modifyvm", :id, "--cpuexecutioncap", "95"]
    vb.customize ["modifyvm", :id, "--nic1", "nat"]
    vb.customize ["modifyvm", :id, "--nictype1", "virtio"]
  end

  config.vm.provider "vmware_desktop" do |v, override|
    override.vm.box = "ubuntu/jammy64"
    v.vmx["memsize"]                = ram.to_s
    v.vmx["numvcpus"]               = cpus.to_s
    v.vmx["tools.upgrade.policy"]   = "manual"
    v.vmx["RemoteDisplay.vnc.enabled"] = "FALSE"
    v.vmx["vhv.enable"]             = "FALSE"
    v.vmx["ethernet0.connectionType"] = "nat"
    v.vmx["ethernet0.wakeOnPacketTx"] = "TRUE"
    v.vmx["ethernet0.addressType"]  = "generated"
  end

  config.vm.provider "libvirt" do |lv, override|
    override.vm.box = "generic/ubuntu2204"
    lv.memory = ram
    lv.cpus   = cpus
  end

  if Vagrant::Util::Platform.windows?
    config.vm.synced_folder ".", "/var/www/pterodactyl",
      type: "smb",
      smb_username: ENV["VAGRANT_SMB_USERNAME"],
      smb_password: ENV["VAGRANT_SMB_PASSWORD"],
      mount_options: ["mfsymlinks"],
      owner: "vagrant", group: "vagrant"
  else
    config.vm.synced_folder ".", "/var/www/pterodactyl",
      type: "nfs",
      nfs_version: 4,
      nfs_udp: false,
      mount_options: ["rw","vers=4","tcp","fsc","rsize=1048576","wsize=1048576"]
  end

  config.vm.provision "shell",
    path: "vagrant/provision.sh",
    keep_color: true,
    privileged: true

  config.vm.post_up_message = <<~MSG
    Pyrodactyl is up and running at http://localhost:3000
    Login with:
      username: dev@pyro.host
      password: password
  MSG
end
