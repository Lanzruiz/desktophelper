# Help Me!

##Dependencies
1. Node JS >= 8.x
2. Electron JS >= 1.7.x

##Local Setup Guide
1. Pull the latest release tag from https://gitlab.com/techdev-aloricagbs/helpme.git
2. Inside the **electron** directory, add a file *env.js* with the following contents:
  ```
    let env = {
    
      api: {
        host: "<helpme-api-host>",
        secret: "<helpme-api-secret>"
      }
    
    };
    
    module.exports = env;
  ```
3. Run *npm install -g electron*
4. Navigate to the project's root directory and run *npm install*.
5. Run *electron .*