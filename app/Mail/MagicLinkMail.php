<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MagicLinkMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $magicLink)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your consider.today sign-in link');
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.auth.magic-link');
    }

    public function attachments(): array
    {
        return [];
    }
}
