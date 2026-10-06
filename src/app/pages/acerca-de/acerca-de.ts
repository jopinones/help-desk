import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  imports: [MatCardModule, MatIconModule],
  selector: 'app-acerca-de',
  styleUrl: './acerca-de.scss',
  templateUrl: './acerca-de.html',
})
export class AcercaDe {}
