#!/bin/bash

# Configuration Variables
MYSQL_ROOT_PASS="password"
MYSQL_USER="pyro"
CONTAINER_NAME="mariadb"
PANEL_DIR="./"  # Adjust to your panel directory
WINGS_DIR="./wings"  # Adjust to your wings directory

# Function to create and configure panel node
setup_panel_node() {
    # Create location
    php artisan p:location:make -n --short local --long "Local Development"

    # Create wings node with dynamic configuration
    NODE_CONFIG=$(php artisan p:node:make -n \
        --name "local-dev" \
        --description "Local Development Node" \
        --locationId 1 \
        --fqdn "localhost:8080" \
        --public 1 \
        --scheme http \
        --proxy 1 \
        --maxMemory 8192 \
        --maxDisk 51200 \
        --overallocateMemory 0 \
        --overallocateDisk 0)

    # Extract node ID (adjust parsing as needed)
    # NODE_ID=$(echo "$NODE_CONFIG" | grep -oP 'Node ID: \K\d+')
    NODE_ID=1

    # Download Wings binary
    mkdir $WINGS_DIR
    curl -L -o "$WINGS_DIR/wings" "https://github.com/pterodactyl/wings/releases/latest/download/wings_linux_$([[ "$(uname -m)" == "x86_64" ]] && echo "amd64" || echo "arm64")"
    chmod u+x "$WINGS_DIR/wings"




    # Add dummy allocations
    mysql -u "$MYSQL_USER" -p"$MYSQL_ROOT_PASS" -h 127.0.0.1 -e "
        USE panel;
        INSERT INTO allocations (node_id, ip, port) VALUES
        ($NODE_ID, 'localhost', 25565),
        ($NODE_ID, 'localhost', 25566),
        ($NODE_ID, 'localhost', 25567);
    "

    mysql -u $MYSQL_USER -p$MYSQL_ROOT_PASS -h 127.0.0.1 -e "INSERT INTO panel.servers (id, external_id, uuid, uuidShort, node_id, name, description, status, skip_scripts, owner_id, memory, swap, disk, io, cpu, threads, oom_disabled, allocation_id, nest_id, egg_id, startup, image, allocation_limit, database_limit, backup_limit, created_at, updated_at, installed_at) VALUES(1, NULL, '7f38298b-d3be-4096-bde0-ee612d2d8257', '7f38298b', 1, 'Dev-Server', '', NULL, 0, 1, 14336, -1, 51200, 500, 0, NULL, 1, 1, 1, 1, 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}', 'ghcr.io/pterodactyl/yolks:java_21', 0, 10, 100, '2024-11-17 00:22:44.000', '2024-11-18 10:30:49.000', '2024-11-18 10:29:39.000');"


    echo "Node created with ID: $NODE_ID"

    # Generate Wings configuration
    php artisan p:node:configuration "$NODE_ID" > "$WINGS_DIR/config.yml"
}

# Main execution
main() {

    read -p "Do you want to delete MariaDB? (yes/no) [default: no]: " user_response

    # Set default response to "no" if input is empty
    user_response=${user_response:-no}

    case "$user_response" in
        [Yy]* )
            echo "Deleting MariaDB..."
            rm -fR ./nix/docker/maria/mariadb_data
            mkdir ./nix/docker/maria/mariadb_data
            ;;
        [Nn]* )
            echo "MariaDB will not be deleted."
            ;;
        * )
            echo "Invalid input. Please answer yes or no."
            ;;
    esac


    # Start MariaDB container
    docker-compose --project-directory ./nix/docker/maria/ up -d --force-recreate

    # Wait for MariaDB to be ready
    until [ "$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME")" == "healthy" ]; do
        sleep 1
    done

    # Navigate to panel directory
    cd "$PANEL_DIR" || exit


    # Setup panel environment
    composer install --no-dev --optimize-autoloader
    php artisan key:generate --force
    php artisan p:environment:setup -n
    php artisan migrate --seed --force -n


    case "$user_response" in
        [Yy]* )
            # Create dev user
            php artisan p:user:make -n \
                --email dev@pyro.host \
                --username dev \
                --name-first dev \
                --name-last dev \
                --password password \
                --admin

            mysql -u $MYSQL_USER -p$MYSQL_ROOT_PASS -h 127.0.0.1 -e "USE panel; UPDATE users SET root_admin = 1;" # workaround because --admin is broken
            # Create Test Server
            ;;
        [Nn]* )
            ;;
    esac



    # Setup panel node
    setup_panel_node

    # Optional: Start development services
    tmux new-session -s pterodactyl-dev -d
    tmux send-keys -t pterodactyl-dev 'npm run dev' C-m
    tmux new-window -t pterodactyl-dev
    tmux send-keys -t pterodactyl-dev 'php artisan serve' C-m
    tmux new-window -t pterodactyl-dev
    tmux send-keys -t pterodactyl-dev: "$WINGS_DIR/wings --config $WINGS_DIR/config.yml" C-m


    tmux attach-session -t pterodactyl-dev

    tmux kill-session -t pterodactyl-dev
    docker-compose --project-directory ./nix/docker/maria/ down
}

# Run main function
main
