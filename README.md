# opengluck-apn

This module is used to send Apple Push Notifications to devices registered with OpenGlück.

## Configuration

[Create a key](https://developer.apple.com/account/resources/authkeys/list) and
download the matching `*.p8` file. Store it somewhere on your system.

Create a file `~/.opengluck-apn` with the following:

```
OPENGLUCK_URL=https://opengluck.example.com
OPENGLUCK_TOKEN=abcdef01234567890abcdef012345678
KEY_ID=ABCDEF1234
TEAM_ID=GHIJKL12345
KEY_FILE=/Users/user/file.p8
```

## FAQ

### Notifications not working on macOS with XCode

Restart the `apsd` daemon:

```bash
sudo killall apsd
```
