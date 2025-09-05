<?php

if (! empty($greeting)) {
    echo $greeting, "\n\n";
} else {
    echo $level == 'error' ? '¡Vaya!' : 'Hola,', "\n\n";
}

if (! empty($introLines)) {
    echo implode("\n", $introLines), "\n\n";
}

if (isset($actionText)) {
    echo "{$actionText}: {$actionUrl}", "\n\n";
}

if (! empty($outroLines)) {
    echo implode("\n", $outroLines), "\n\n";
}

echo 'Gracias por confiar en Zelora,', "\n";
echo config('app.name'), "\n";
