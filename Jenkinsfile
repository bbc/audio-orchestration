@Library("rd-apmm-groovy-ci-library@v1.x") _

pipeline {
  agent {
    dockerfile {
      args "-v /etc/pki/tls/:/etc/pki/tls/ -v /etc/passwd:/etc/passwd -v /etc/ssh/ssh_config/:/etc/ssh/ssh_config/ -v /var/tmp/jenkins/.ssh:/var/tmp/jenkins/.ssh"
    }
  }
  options {
    ansiColor('xterm') // Add support for coloured output
    buildDiscarder(logRotator(numToKeepStr: '10')) // Discard old builds
    timeout(time: 10, unit: 'MINUTES')
  }
  environment { 
    HOME="/var/tmp/home-for-npm"  // Override the npm cache directory to avoid: EACCES: permission denied, mkdir '/.npm'
    yarn_cache_folder="/var/tmp/yarn-cache"  // give an explicit location for the cache inside the jenkins workspace
    publishReg = "https://artifactory.virt.ch.bbc.co.uk/artifactory/api/npm/iic-npm"
    authCredentialsId = "5b6641fe-5581-4c8c-9cdf-71f17452c065"
    publishEmail = "support@rd.bbc.co.uk"
  }
  stages {
    stage ("Setup") {
      steps {
        withBBCRDJavascriptArtifactory {
          sh "yarn config set registry \"https://artifactory.virt.ch.bbc.co.uk/artifactory/api/npm/npm\""
          sh "yarn --skip-integrity-check --non-interactive --no-progress install"
        }
      }
    }
    stage ("Lint") {
      steps {
        bbcNpmRunScript("lint")
      }
    }
    stage ("Test") {
      steps {
        bbcNpmRunScript("test")
      }
    }
    stage ("Build") {
      steps {
        bbcNpmRunScript("build")
      }
    }
    stage ("Publish") {
      when {
        expression { bbcShouldNpmPublish(branches: ["master"], reg: publishReg) }
      }
      steps {
        script {
          withBBCRDJavascriptArtifactory {
            withCredentials([string(credentialsId: authCredentialsId, variable: 'AUTH_TOKEN')]) {
              sh "npm publish --reg ${publishReg} --email=${publishEmail}"
            }
          }
        }
      }
    }
  }
}
