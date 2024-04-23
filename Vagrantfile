Vagrant.configure("2") do |config|
    config.vm.box = "almalinux/9"
    config.vm.network "forwarded_port", guest: 3000, host: 3000, host_ip: "localhost"
    config.vm.network "forwarded_port", guest: 8080, host: 8080, host_ip: "localhost"
    config.vm.provider "virtualbox" do |vb|
        vb.memory = "8192"
        vb.cpus = "4"
    end
    
    # setup the synced folder and provision the VM
    config.vm.synced_folder ".", "/var/www/pterodactyl"
    config.vm.provision "shell", path: "vagrant/provision.sh"
    config.vm.post_up_message = "Pterodactyl is up and running at http://localhost:3000. Login with username: dev@pyro.host, password: 'password'."

    # allocated testing ports
    config.vm.network "forwarded_port", guest: 25565, host: 25565, host_ip: "localhost"
    config.vm.network "forwarded_port", guest: 25566, host: 25566, host_ip: "localhost"
    config.vm.network "forwarded_port", guest: 25567, host: 25567, host_ip: "localhost"
end
