const {
  execFileSync
} = require('child_process')

class Git {
  constructor(reps) {
    this.reps = reps
  }

  command(cmd) {
    return execFileSync('git', cmd, {
      cwd: this.reps
    }).toString('utf8')
  }

  pull() {
    return this.command('pull')
  }
}

module.exports = Git