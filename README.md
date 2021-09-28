# homebridge-ai-sync-platform
Enables AI Synch Fans and their lights in Homebridge for homekit (forked from [wylanswets](https://github.com/wylanswets/homebridge-ai-sync-platform))

To install:

    npm install -g @seydx/homebridge-ai-sync-platform

To configure, add this to your homebridge config.json file:
    
    
    "platforms": [
        {
            "platform": "AISync",
            "name": "AISync Platform",
            "email": "your_email@email.com",
            "password": "your_password"
        }
    ]


## Supports:
* Fans
* Lights within the fan
