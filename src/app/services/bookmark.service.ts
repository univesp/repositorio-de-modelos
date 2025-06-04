import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root', // Torna o serviço acessível em toda a aplicação
})
export class BookmarkService {
  private STORAGE_KEY = 'modelosSalvos'; // Nome da chave no localStorage

  // Retorna os IDs salvos no localStorage (como array de numbers)
  private getSalvos(): string[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : []; // Se não tiver nada, retorna array vazio
  }

  // Salva o array de IDs no localStorage
  private saveSalvos(ids: string[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ids));
  }

  // Verifica se um ID está presente no array salvo
  isSalvo(id: string): boolean {
    return this.getSalvos().includes(id);
  }

  // Adiciona ou remove um ID dos salvos
  toggle(id: string): void {
    const salvos = this.getSalvos();
    const index = salvos.indexOf(id);

    if (index > -1) {
      salvos.splice(index, 1); // Se já existe, remove
    } else {
      salvos.push(id); // Se não existe, adiciona
    }

    this.saveSalvos(salvos); // Atualiza no localStorage
  }
}
