# How to Setup VirtualBox on Different Systems

> [!IMPORTANT]
> If you Know how to setup virtualbox on A system that isn't in this list
> please make a pr with steps on how to


## Fedora 40

There are multiple options when it comes to Installing Vbox on Fedora,

  - Option 1: Disable Secure Boot
  
If you go with Option 1, all you have to do is reboot your computer,
go into the bios and disable secure boot

  - Option 2: Self Sign Certificates

Option 2 Is a little more involved, it will also require you run a
script after each major system update.

  - Make sure you system is up to date
`sudo dnf update`

  - Install mokutil
`sudo dnf install mokutil`

  - Create RSA key in new folder
``` bash
sudo -i
mkdir /root/signed-modules
cd /root/signed-modules
openssl req -new -x509 -newkey rsa:2048 -keyout MOK.priv -outform DER -out MOK.der -nodes -days 36500 -subj "/CN=VirtualBox/"
chmod 600 MOK.priv
```
  - Initialize mokutil
This command will ask for a pasword, make sure it's something you know
as you will be asked it the next time you reboot your system
> [!IMPORTANT]
> It only asks on the next boot after this command is run, no other times

`sudo mokutil --import MOK.der`

  - Reboot System
> [!IMPORTANT]
> Once you reboot your system you will get
> a blue screen where it asks if you want to initialize mok
> Click it then go to `Enroll mok`->`continue`->`Input Password`
> The password will be whatever you set it to in the last step

  - Make a new bash script so that you can run these commands after a major update
```bash
#!/bin/bash

sudo -i
mkdir /root/signed-modules
cd /root/signed-modules
openssl req -new -x509 -newkey rsa:2048 -keyout MOK.priv -outform DER -out MOK.der -nodes -days 36500 -subj "/CN=VirtualBox/"
chmod 600 MOK.priv

sudo mokutil --import MOK.der
```

  - Create a Script to sign Certificates
`cd /root/signed-modules`
Using whatever code editor you use, go to the following file
`nvim sign-virtual-box`

```bash
#!/bin/bash

for modfile in $(dirname $(modinfo -n vboxdrv))/*.ko; do
  echo "Signing $modfile"
  /usr/src/kernels/$(uname -r)/scripts/sign-file sha256 \
                                /root/signed-modules/MOK.priv \
                                /root/signed-modules/MOK.der "$modfile"
done
```

> [!TIP]
> Should this script fail when you run it, you can use the following command
> to ensure file paths are correct
> `find /usr/src -name sign-file`

  - Run file
We're going to add exec permissions to the file and run it
`chmod 700 sign-virtual-box`
`./sign-virtual-box`
  - Launch Virtualbox
`modprobe vboxdrv`

And that should be it, you should have virtualbox on your system, in order to tell vagrant to use virtuablbox though,
you need to go to your enviroment file which is located at `~/.bashrc` if your using bash or `~/.zshrc` if your using zsh
and add this

`export VAGRANT_DEFAULT_PROVIDER=virtualbox`

