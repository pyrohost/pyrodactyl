Vagrant.configure("2") do |config|
    config.vm.box = "almalinux/9"
    config.vm.network "forwarded_port", guest: 3000, host: 3000, host_ip: "localhost"
    config.vm.network "forwarded_port", guest: 8080, host: 8080, host_ip: "localhost"

    # you need enough RAM for packages to install properly
    config.vm.provider "virtualbox" do |vb|
        vb.memory = "4096"
        vb.cpus = "4"
        vb.cpuexecutioncap = 95
        vb.customize ["modifyvm", :id, "--nictype1", "virtio"]
        vb.customize ["modifyvm", :id, "--nictype2", "virtio"]
        vb.customize ["storagectl", :id, "--name", "IDE Controller", "--remove"]
        vb.customize ["storagectl", :id, "--name", "SATA Controller", "--add", "sata"]
        vb.customize ["modifyvm", :id, "--boot1", "disk"]
        vb.customize ["modifyvm", :id, "--nic1", "nat"]

    end
    config.vm.provider "vmware_desktop" do |v|
        v.vmx["memsize"] = "4096"
        v.vmx["numvcpus"] = "4"
        v.vmx["tools.upgrade.policy"] = "manual"
        v.vmx["RemoteDisplay.vnc.enabled"] = "FALSE"
        v.vmx["vhv.enable"] = "FALSE"
        v.vmx["ethernet0.connectionType"] = "nat"
        v.vmx["ethernet0.wakeOnPacketTx"] = "TRUE"
        v.vmx["ethernet0.addressType"] = "generated"
    end
    # Libvirt provider
    config.vm.provider "libvirt" do |libvirt|
        libvirt.memory = 8192
        libvirt.cpus = 4
        config.vm.network "public_network", dev: "bridge0"

    end
    # setup the synced folder and provision the VM
    config.vm.synced_folder ".", "/var/www/pterodactyl"
      # type: "virtualbox"
    #   nfs_version: 4

    config.vm.provision "shell", path: "vagrant/provision.sh"

    config.vm.hostname = "pyrodactyl-dev"


    config.vm.post_up_message = "Pterodactyl is up and running at http://localhost:3000. Login with username: dev@pyro.host, password: 'password'."

    # allocated testing ports
    config.vm.network "forwarded_port", guest: 25565, host: 25565, host_ip: "localhost"
    config.vm.network "forwarded_port", guest: 25566, host: 25566, host_ip: "localhost"
    config.vm.network "forwarded_port", guest: 25567, host: 25567, host_ip: "localhost"
end
