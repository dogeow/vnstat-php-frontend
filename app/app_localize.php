<?php
    function app_localize_store($translations = null)
    {
        static $messages = [];

        if (is_array($translations)) {
            $messages = $translations;
        }

        return $messages;
    }

    function app_localize_load($locale, $language)
    {
        setlocale(LC_ALL, $locale);

        $resolvedLanguage = $language;
        $languageFile = __DIR__.'/../lang/'.$language.'.php';
        if (!is_file($languageFile)) {
            $resolvedLanguage = 'en';
            $languageFile = __DIR__.'/../lang/en.php';
        }

        $L = [];
        require $languageFile;

        app_localize_store(is_array($L) ? $L : []);

        return $resolvedLanguage;
    }

    function __($str)
    {
        $translations = app_localize_store();

        return isset($translations[$str]) ? $translations[$str] : $str;
    }
