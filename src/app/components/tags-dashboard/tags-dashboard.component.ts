import { Component } from '@angular/core';

@Component({
  selector: 'app-tags-dashboard',
  templateUrl: './tags-dashboard.component.html',
  styleUrl: './tags-dashboard.component.scss'
})
export class TagsDashboardComponent {
  tagsPopulares = [
    {
      tags: ["Justo", "Imperdiet", "Dolor", "Varius", "At", "Mattis", "Etiam", "Purus", "Dictum", "Sit", "In", "Pellentesque", "Enim", "Accumsan", "Aliquet", "Dignissim"]
    }
  ]
}
