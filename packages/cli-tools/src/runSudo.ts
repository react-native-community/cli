import sudo from '@vscode/sudo-prompt';

export default function runSudo(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    sudo.exec(command, {name: 'React Native CLI'}, (error) => {
      if (error) {
        reject(error);
      }

      resolve();
    });
  });
}
