// @ts-nocheck
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs')
const path = require('path')
const simplegit = require('simple-git');

const reName = (target, source) => {
  return new Promise((resolve) => {
    const targetPath = path.join(target, path.basename(source))
    console.log(targetPath, target, source)
    var readStream = fs.createReadStream(source)
    var writeStream = fs.createWriteStream(targetPath);
    readStream.pipe(writeStream);
    resolve('ok')
  })
}
const gitHandle = async (uploadUrl, filePath) => {
  const git = simplegit(uploadUrl);
  await git.pull('origin', 'master');
  await git.add('./*');
  await git.commit('image update commit!');
  // await git.push('origin', 'master');
  vscode.env.clipboard.writeText(`<cdn-image extClass="weapp-image" src="images/${path.basename(filePath)}" />`);
}

const uploadImage = async (uploadUrl, filePath) => {
  try {
    let isRe = await reName(uploadUrl, filePath)
    if (!isRe) return
    vscode.window.withProgress({
      title: '正在上传...',
      location: vscode.ProgressLocation.Notification
    }, async () => {
      return new Promise((resolve) => gitHandle(uploadUrl, filePath).then(resolve()))
    });
  } catch (error) {
    console.log(error)
  }
}

async function activate(context) {
  const uploadHereConfig = vscode.workspace.getConfiguration('upload here');
  const uploadUrl = uploadHereConfig.uploadUrl;
  if (!uploadUrl) {
    vscode.window.showInformationMessage('请先配置图片上传接口地址');
    return;
  }
  let disposable = vscode.commands.registerCommand('upload-here.UploadHere', async () => {
    let fileUri = await vscode.window.showOpenDialog({
      canSelectFolders: false,
      canSelectMany: false,
      filters: {
        'Images': ['png', 'jpg', 'ico', 'jpeg', 'svg', 'gif']
      }
    })
    if (fileUri && fileUri[0]) {
      await uploadImage(uploadUrl, fileUri[0].fsPath);
    }
  });
  context.subscriptions.push(disposable);
}

module.exports = {
  activate
}