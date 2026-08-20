# RAG Notları

## Chunking Stratejisi
Sabit boyutlu chunking (1000 karakter) + 150 karakter overlap kullanıldı.
Overlap, cümle/paragraf ortasında bölünme durumunda anlam kaybını azaltmak
için tercih edildi. Daha gelişmiş yöntemler (cümle/paragraf sınırlarına göre
bölme, semantic chunking) süre kısıtı nedeniyle bilinçli olarak atlandı.