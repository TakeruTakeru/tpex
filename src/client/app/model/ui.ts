export class UI {
  private scoreElement: HTMLElement;
  private shootButton: HTMLElement | null = null;
  private crosshair: HTMLElement;

  constructor(private onShoot: () => void) {
    // クロスヘアの作成
    this.crosshair = document.createElement("div");
    this.crosshair.style.position = "absolute";
    this.crosshair.style.top = "50%";
    this.crosshair.style.left = "50%";
    this.crosshair.style.transform = "translate(-50%, -50%)";
    this.crosshair.style.width = "20px";
    this.crosshair.style.height = "20px";
    this.crosshair.style.border = "2px solid white";
    this.crosshair.style.borderRadius = "50%";
    document.body.appendChild(this.crosshair);

    // スコア表示要素の作成
    this.scoreElement = document.createElement("div");
    this.scoreElement.style.position = "absolute";
    this.scoreElement.style.top = "20px";
    this.scoreElement.style.left = "20px";
    this.scoreElement.style.color = "white";
    this.scoreElement.style.fontSize = "24px";
    this.scoreElement.style.fontFamily = "Arial, sans-serif";
    this.scoreElement.textContent = "Score: 0";
    document.body.appendChild(this.scoreElement);

    // モバイル用射撃ボタンの作成
    if (this.isMobile()) {
      this.createShootButton();
    }
  }

  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  private createShootButton() {
    this.shootButton = document.createElement("button");
    this.shootButton.style.position = "absolute";
    this.shootButton.style.bottom = "20px";
    this.shootButton.style.right = "20px";
    this.shootButton.style.padding = "15px 30px";
    this.shootButton.style.fontSize = "18px";
    this.shootButton.style.backgroundColor = "#ff4444";
    this.shootButton.style.color = "white";
    this.shootButton.style.border = "none";
    this.shootButton.style.borderRadius = "5px";
    this.shootButton.style.cursor = "pointer";
    this.shootButton.textContent = "Shoot";
    this.shootButton.addEventListener("click", () => this.onShoot());
    document.body.appendChild(this.shootButton);
  }

  public updateScore(score: number) {
    this.scoreElement.textContent = `Score: ${score}`;
  }

  public dispose() {
    document.body.removeChild(this.scoreElement);
    document.body.removeChild(this.crosshair);
    if (this.shootButton) {
      document.body.removeChild(this.shootButton);
    }
  }
}
