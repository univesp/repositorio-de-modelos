import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cadastro-modelo',
  templateUrl: './cadastro-modelo.component.html',
  styleUrls: ['./cadastro-modelo.component.scss']
})
export class CadastroModeloComponent implements OnInit {

  // Propriedades para o gerenciamento de tags
  tags: string[] = [];
  currentTagInput: string = '';
  maxTags: number = 7;

  // Propriedades para o carregamento da imagem
  selectedFile: File | null = null; // Stores the selected image file
  imagePreviewUrl: string | ArrayBuffer | null = null; // URL for image preview
  imageErrorMessage: string | null = null; // Error messages related to the image

  constructor() { }

  ngOnInit(): void {
    // Component initialization logic, if needed.
  }

  /**
   * Normalizes a tag string: removes extra spaces, converts to lowercase,
   * removes accents and special characters.
   * @param tag The tag string to be normalized.
   * @returns The normalized tag.
   */
  private normalizeTag(tag: string): string {
    return tag.trim()
              .toLowerCase()
              .normalize('NFD') // Normalizes to NFD form (separates letter from accent)
              .replace(/[\u0300-\u036f]/g, ''); // Removes diacritics (accents)
  }

  /**
   * Adds tags from the text input to the `tags` array.
   * The function is triggered by keyboard events (comma, Enter) and the `blur` event.
   * Handles multiple comma-separated tags, normalization, duplicates, and the maximum limit.
   * @param event The DOM event that triggered the function (optional, to prevent Enter's default behavior).
   */
  addTagFromInput(event?: Event): void {
    // Prevents default Enter key behavior (form submission)
    if (event && (event as KeyboardEvent).key === 'Enter') {
      event.preventDefault();
    }

    // Processes the typed text, splitting by commas and cleaning
    const input = this.currentTagInput.trim();
    if (input) {
      const newTags = input.split(',')
                           .map(tag => this.normalizeTag(tag))
                           .filter(tag => tag !== '' && tag.length >= 2); // Filters empty or too short tags

      newTags.forEach(tag => {
        // Adds the tag only if it's not a duplicate and the limit hasn't been reached
        if (this.tags.length < this.maxTags && !this.tags.includes(tag)) {
          this.tags.push(tag);
        }
      });
      this.currentTagInput = ''; // Clears the input after adding tags
    }
  }

  /**
   * Removes a specific tag from the `tags` array.
   * @param tagToRemove The tag to be removed.
   */
  removeTag(tagToRemove: string): void {
    this.tags = this.tags.filter(tag => tag !== tagToRemove);
  }

  /**
   * Handles file selection for the image field.
   * @param event The change event from the file input.
   */
  onFileSelected(event: Event): void {
    this.selectedFile = null; // Clears previous file
    this.imagePreviewUrl = null; // Clears previous preview
    this.imageErrorMessage = null; // Clears any previous error message

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // File type validation
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        this.imageErrorMessage = 'Invalid file format. Please select a PNG or JPG image.';
        return;
      }

      // File size validation (e.g., max 2MB)
      const maxSize = 2 * 1024 * 1024; // 2 MB
      if (file.size > maxSize) {
        this.imageErrorMessage = `The file is too large. The maximum allowed size is ${maxSize / (1024 * 1024)} MB.`;
        return;
      }

      this.selectedFile = file;

      // Create URL for image preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result;
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        this.imageErrorMessage = 'Could not read image file.';
      };
      reader.readAsDataURL(file); // Reads the file as a data URL (base64)
    } else {
      this.imageErrorMessage = 'No file selected.';
    }
  }

  /**
   * Removes the selected image and its preview.
   */
  removeImage(): void {
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.imageErrorMessage = null;
    // Optional: Clear the file input (if you need to reset selection)
    const fileInput = document.getElementById('carregaImagem') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ''; // Clears the selected file in the input element
    }
  }
}
