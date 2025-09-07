<?php

namespace Pterodactyl\Services\Subdomain;

use Illuminate\Support\Str;

class SubdomainGeneratorService
{
    /**
     * List of adjectives for generating readable subdomains.
     */
    private array $adjectives = [
        "swift",
        "brave",
        "calm",
        "dark",
        "eager",
        "fair",
        "glad",
        "kind",
        "light",
        "mild",
        "neat",
        "proud",
        "quick",
        "rich",
        "safe",
        "tall",
        "warm",
        "wise",
        "bold",
        "busy",
        "cool",
        "deep",
        "fast",
        "good",
        "happy",
        "late",
        "loud",
        "nice",
        "pure",
        "real",
        "soft",
        "true",
        "wild",
        "young",
        "blue",
        "free",
        "green",
        "sharp",
        "small",
        "solid",
        "sweet",
        "white",
        "quiet",
        "red",
        "fuzzy",
        "bright",
        "clever",
        "gentle",
        "mighty",
        "noble",
        "sunny",
        "jolly",
        "lucky",
        "ancient",
        "angry",
        "autumn",
        "black",
        "bloody",
        "breezy",
        "chilly",
        "cloudy",
        "cuddly",
        "dusty",
        "early",
        "empty",
        "fancy",
        "fiery",
        "frozen",
        "golden",
        "graceful",
        "heavy",
        "icy",
        "jaded",
        "loyal",
        "magic",
        "modern",
        "narrow",
        "old",
        "orange",
        "playful",
        "rapid",
        "rare",
        "rocky",
        "round",
        "royal",
        "rusty",
        "silent",
        "silver",
        "sleepy",
        "slow",
        "smooth",
        "sparkly",
        "spicy",
        "spring",
        "stormy",
        "strange",
        "strong",
        "summer",
        "super",
        "sweet",
        "tiny",
        "tough",
        "twinkly",
        "vast",
        "wavy",
        "winter",
        "yellow",
        "agile",
        "alert",
        "balanced",
        "brilliant",
        "curious",
        "daring",
        "elegant",
        "faithful",
        "fearless",
        "gentle",
        "grumpy",
        "hopeful",
        "hungry",
        "joyful",
        "lonely",
        "mellow",
        "mysterious",
        "patient",
        "practical",
        "proud",
        "quiet",
        "rebellious",
        "shy",
        "silly",
        "sneaky",
        "steady",
        "tender",
        "thankful",
        "timid",
        "trusty",
        "vivid",
        "wicked",
        "zealous",
    ];

    /**
     * List of animals for generating readable subdomains.
     */
    private array $animals = [
        "bear",
        "bird",
        "cat",
        "deer",
        "dog",
        "duck",
        "fish",
        "frog",
        "goat",
        "hawk",
        "lion",
        "owl",
        "panda",
        "seal",
        "swan",
        "tiger",
        "wolf",
        "zebra",
        "eagle",
        "horse",
        "koala",
        "mouse",
        "otter",
        "puppy",
        "rabbit",
        "snake",
        "whale",
        "camel",
        "crow",
        "dove",
        "gecko",
        "llama",
        "puma",
        "shark",
        "sheep",
        "sloth",
        "toad",
        "turtle",
        "beaver",
        "falcon",
        "iguana",
        "monkey",
        "parrot",
        "pigeon",
        "raven",
        "salmon",
        "fox",
        "antelope",
        "buffalo",
        "chameleon",
        "coyote",
        "jaguar",
        "leopard",
        "meerkat",
        "porcupine",
        "raccoon",
        "vulture",
        "walrus",
        "woodpecker",
        "ferret",
        "hedgehog",
        "platypus",
        "armadillo",
        "badger",
        "alligator",
        "alpaca",
        "anteater",
        "baboon",
        "bat",
        "bison",
        "boar",
        "caribou",
        "cheetah",
        "chimp",
        "cobra",
        "crab",
        "dingo",
        "donkey",
        "dragonfly",
        "eel",
        "elephant",
        "elk",
        "gazelle",
        "giraffe",
        "gorilla",
        "hamster",
        "heron",
        "hippo",
        "hummingbird",
        "jackal",
        "kangaroo",
        "lemur",
        "lynx",
        "mammoth",
        "manatee",
        "marmot",
        "mole",
        "moose",
        "narwhal",
        "newt",
        "orca",
        "penguin",
        "polar",
        "quail",
        "quokka",
        "rat",
        "robin",
        "salamander",
        "scorpion",
        "sealion",
        "skunk",
        "sparrow",
        "squid",
        "starfish",
        "stork",
        "tarantula",
        "turkey",
        "viper",
        "weasel",
        "wolverine",
        "yak",
        "dragon",
        "griffin",
        "phoenix",
        "unicorn",
        "pegasus",
        "kraken",
    ];

    /**
     * Generate a random subdomain in the format: adjective-animal-number.
     * - Number is a 3-digit integer in [100, 999] → 900 possibilities.
     * - With ~200 adjectives and ~250 animals, the base pool size is:
     *   200 × 250 × 900 = 45,000,000 possible subdomains.
     * Str::slug() ensures a DNS-safe label.
     */
    public function generate(): string
    {
        $adjective = $this->adjectives[array_rand($this->adjectives)];
        $animal = $this->animals[array_rand($this->animals)];
        $number = mt_rand(100, 999);

        // Ensure DNS-safe format
        return Str::slug(sprintf("%s-%s%d", $adjective, $animal, $number));
    }

    /**
     * Generate a unique subdomain not present in $existingSubdomains.
     * Tries up to $maxAttempts times using the base pool (~45M possibilities).
     * If all attempts collide, fall back to a larger space by appending a 5-char random suffix.
     */
    public function generateUnique(
        array $existingSubdomains,
        int $maxAttempts = 50
    ): string {
        $attempts = 0;

        while ($attempts < $maxAttempts) {
            $subdomain = $this->generate();

            if (!in_array($subdomain, $existingSubdomains, true)) {
                return $subdomain;
            }

            $attempts++;
        }

        // Fallback: ensure uniqueness with much larger pool.
        // Str::random(5) → [a-z0-9], i.e. 36^5 = 60,466,176 suffix possibilities.
        // With ~200 adjectives × ~250 animals, fallback space is:
        // 200 × 250 × 60,466,176 = 3,023,308,800,000 (~3 trillion).
        
        // So basically, if we ever hit this fallback, we are almost certainly
        // filthy rich or extremely unlucky. Either way, we win. - ellie
        return Str::slug(
            sprintf(
                "%s-%s-%s",
                $this->adjectives[array_rand($this->adjectives)],
                $this->animals[array_rand($this->animals)],
                strtolower(Str::random(5))
            )
        );
    }
}
