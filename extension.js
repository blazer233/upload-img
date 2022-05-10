// @ts-nocheck
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs')
const path = require('path')
const simplegit = require('simple-git');
const exists = async filePath => await fs.promises.access(filePath).then(() => true).catch(() => false)


const reName = async (target, folder, sources) => {
  try {
    return await Promise.all(sources.map(async i => {
      const folderPath = path.join(target, folder, path.basename(i))
      let res = await exists(folderPath)
      if (!res) {
        let readStream = fs.createReadStream(i)
        let writeStream = fs.createWriteStream(folderPath);
        readStream.pipe(writeStream);
      } else {
        vscode.window.showErrorMessage('检查文件名是否重复！');
        return Promise.reject('检查文件名是否重复！')
      }
    }))
  } catch (error) {
    vscode.window.showErrorMessage(error);
  }
}
const gitHandle = async (uploadUrl, filePaths, folder, progress) => {
  let str = ''
  for (let i = 0; i < filePaths.length; i++) {
    str += `<cdn-image extClass="weapp-image" src="${folder}/${path.basename(filePaths[i])}" />\n`
  }
  const isRemove = await reName(uploadUrl, folder, filePaths);
  console.log(isRemove, uploadUrl)
  if (!isRemove) return
  progress.report({
    increment: 20,
    message: "文件已拷贝到指定目录"
  });
  const git = simplegit(uploadUrl);
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
}

//D:\\work_code\\weapp-image\\dist\\weapp-workbench\\images
async function activate(context) {
  const uploadHereConfig = vscode.workspace.getConfiguration('upload img');
  const {
    uploadUrl,
    targetSrc: folder
  } = uploadHereConfig
  if (!uploadUrl) {
    vscode.window.showInformationMessage('请先配置图片上传接口地址');
    return;
  }
  if (!folder) {
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
      fileUri = fileUri.map(i => i.fsPath)
      try {
        vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification
        }, (progress) => gitHandle(uploadUrl, fileUri, folder, progress))
      } catch (error) {
        vscode.window.showErrorMessage(error);
      }
    }
  });
  context.subscriptions.push(disposable);
}

module.exports = {
  activate
}