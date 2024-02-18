Vagrant.configure("2") do |config|
    config.vm.box = "almalinux/9"
    config.vm.network "forwarded_port", guest: 3000, host: 3000
    config.vm.network "forwarded_port", guest: 8080, host: 8080
    config.vm.provider "virtualbox" do |vb|
        vb.memory = "8192"
        vb.cpus = "4"
    end
    
    # setup the synced folder and provision the VM
    config.vm.synced_folder ".", "/var/www/pterodactyl"
    config.vm.provision "shell", path: "provision.sh"
end
