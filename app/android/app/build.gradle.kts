import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// Release signing: android/key.properties (gitignored) points at the upload keystore.
val keyProperties = Properties().apply {
    val file = rootProject.file("key.properties")
    if (file.exists()) file.inputStream().use { load(it) }
}

// Social login keys: android/secrets.properties (gitignored).
val secrets = Properties().apply {
    val file = rootProject.file("secrets.properties")
    if (file.exists()) file.inputStream().use { load(it) }
}

android {
    namespace = "com.jeondowon.candle"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "com.jeondowon.candle"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        // AdMob app ID. Defaults to Google's public test app; pass -PADMOB_APP_ID=... for release.
        manifestPlaceholders["admobAppId"] =
            (project.findProperty("ADMOB_APP_ID") as String?) ?: "ca-app-pub-3940256099942544~3347511713"
        manifestPlaceholders["kakaoScheme"] = "kakao" + secrets.getProperty("KAKAO_NATIVE_APP_KEY", "")
        resValue("string", "naver_client_id", secrets.getProperty("NAVER_CLIENT_ID", ""))
        resValue("string", "naver_client_secret", secrets.getProperty("NAVER_CLIENT_SECRET", ""))
        resValue("string", "naver_client_name", secrets.getProperty("NAVER_CLIENT_NAME", "Candle"))
    }

    signingConfigs {
        if (keyProperties.isNotEmpty()) {
            create("release") {
                storeFile = file(keyProperties.getProperty("storeFile"))
                storePassword = keyProperties.getProperty("storePassword")
                keyAlias = keyProperties.getProperty("keyAlias")
                keyPassword = keyProperties.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            // Without key.properties the release build is debug-signed (local runs only;
            // Play Console rejects it).
            signingConfig = signingConfigs.findByName("release") ?: signingConfigs.getByName("debug")
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}

flutter {
    source = "../.."
}
