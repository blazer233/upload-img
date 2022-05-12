// @ts-nocheck
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs')
const path = require('path')
const simplegit = require('simple-git');
const exists = async filePath => await fs.promises.access(filePath).then(() => true).catch(() => false)
const copyFolder = async (read, path) => new Promise((resolve, reject) => fs.createReadStream(read).pipe(fs.createWriteStream(path)).on('finish', resolve).on('error', reject))


const copyHandle = async sources => {
  try {
    let isRepeat = await Promise.all(sources.map(async i => {
      let res = await exists(i.folderPath)
      if (res) {
        vscode.window.showErrorMessage('检查文件名是否重复！');
        return Promise.reject()
      }
    }))
    if (isRepeat) {
      return await Promise.all(sources.map(async i => await copyFolder(i.fsPath, i.folderPath)))
    }
  } catch (error) {
    console.log(error)
    vscode.window.showErrorMessage(error);
  }
}
const gitHandle = async (uploadUrl, filePaths, folder, progress) => {
  try {
    let str = ''
    for (let i = 0; i < filePaths.length; i++) {
      str += `<cdn-image extClass="weapp-image" src="${folder}/${path.basename(filePaths[i].fsPath)}" />\n`
    }
    const isRemove = await copyHandle(filePaths);
    if (!isRemove) return
    const git = simplegit(uploadUrl);
    progress.report({
      increment: 20,
      message: "文件已拷贝到指定目录"
    });
    await git.pull('origin', 'master');
    progress.report({
      increment: 40,
      message: "git已更新"
    });
    await git.add('./');
    progress.report({
      increment: 60,
      message: "文件已添加"
    });
    await git.commit('image update commit!');
    progress.report({
      increment: 80,
      message: "文件已提交"
    });
    await git.push('origin', 'master');
    progress.report({
      increment: 100,
      message: "文件已上传"
    });
    vscode.env.clipboard.writeText(str);
    vscode.window.showInformationMessage('请粘贴代码');
  } catch (error) {
    vscode.window.showErrorMessage(error);
  }
}
exports.activate = (context) => {
  const getConfig = vscode.workspace.getConfiguration('upload img');
  if (!getConfig.uploadUrl) {
    vscode.window.showInformationMessage('请先配置图片上传接口地址');
    return;
  }
  if (!getConfig.targetSrc) {
    vscode.window.showInformationMessage('请先配置图片上传文件夹');
    return;
  }
  let disposable = vscode.commands.registerCommand('kf-upload-img.UploadHere', async () => {
    let fileUri = await vscode.window.showOpenDialog({
      canSelectFolders: false,
      canSelectMany: true,
      filters: {
        'Images': ['png', 'jpg', 'ico', 'jpeg', 'svg', 'gif']
      }
    })
    if (fileUri && fileUri[0]) {
      fileUri = fileUri.map((i) => ({
        fsPath: i.fsPath,
        folderPath: path.join(getConfig.uploadUrl, getConfig.targetSrc, path.basename(i.fsPath)).split(path.sep).join('/')
      }))
      try {
        vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification
        }, (progress) => gitHandle(getConfig.uploadUrl, fileUri, getConfig.targetSrc, progress))
      } catch (error) {
        vscode.window.showErrorMessage(error);
      }
    }
  });
  context.subscriptions.push(disposable);
}